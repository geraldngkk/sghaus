// SGHaus data collection web app (Google Apps Script).
// Deployed as: Execute as Me, Who has access: Anyone. Because anyone can call it, every request
// must carry the shared secret, and every value is re-checked here before it is written.
//
// Script Properties (Project Settings > Script Properties), never committed:
//   SHARED_SECRET    same value as SHEETS_SHARED_SECRET in Vercel production
//   SHEET_ID         the main SGHaus spreadsheet
//   CLINIC_SHEET_ID  a separate spreadsheet that only Gerald can open (never shared by link)
//   NOTIFY_EMAIL     where contact and outcome notifications go
//
// Lead scoring (updateLeadScore and the Lead Scores tab) is switched off for the
// SG Partnerships Fund application: nothing here scores users.

var MAX_LEN = 2000;
var FORMULA_TRIGGERS = ["=", "+", "-", "@", "\t", "\r"];

function prop_(name) {
  return PropertiesService.getScriptProperties().getProperty(name);
}

function reply_(status) {
  return ContentService.createTextOutput(JSON.stringify({ status: status }))
    .setMimeType(ContentService.MimeType.JSON);
}

// Plain text only: strip formula triggers and cap length.
function cell_(value) {
  if (value === null || value === undefined) return "";
  if (typeof value === "number" || typeof value === "boolean") return value;
  var text = String(value).slice(0, MAX_LEN);
  for (var i = 0; i < FORMULA_TRIGGERS.length; i++) {
    if (text.indexOf(FORMULA_TRIGGERS[i]) === 0) return "'" + text;
  }
  return text;
}

function sheet_(ss, name, headers) {
  var sheet = ss.getSheetByName(name) || ss.insertSheet(name);
  if (sheet.getRange("A1").getValue() === "") sheet.appendRow(headers);
  return sheet;
}

function append_(sheet, values) {
  sheet.appendRow(values.map(cell_));
}

function isEmail_(value) {
  return typeof value === "string" && value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
}

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var secret = prop_("SHARED_SECRET");
    if (!secret || data.secret !== secret) return reply_("error");

    var ss = SpreadsheetApp.openById(prop_("SHEET_ID"));
    var now = new Date().toISOString();

    if (data.type === "analysis") {
      var searches = sheet_(ss, "Searches", ["Timestamp","Town","Flat Type","Street","Block","Storey","Floor Area (sqm)","Lease Start","Offer Low","Offer Mid","Offer Max","Low PSF","Mid PSF","Max PSF","Tier 1 Comps","Tier 2 Comps","Tier 3 Comps","Total Records","Median PSF","Trend","Trend %","Txn Count 12m","Reno Condition","Reno Score","Reno Cost Low","Reno Cost High","Reno Adjust %","Risk Count","High Risks","UTM Source","UTM Medium","UTM Campaign"]);
      append_(searches, [data.timestamp || now,data.town,data.flatType,data.streetName,data.block,data.storeyRange,data.floorAreaSqm,data.leaseCommenceDate,data.offerLow,data.offerMid,data.offerMax,data.offerLowPsf,data.offerMidPsf,data.offerMaxPsf,data.tier1Count,data.tier2Count,data.tier3Count,data.totalRecords,data.medianPsf,data.trendDirection,data.trendPercent,data.transactionCount12m,data.renoCondition,data.renoScore,data.renoCostLow,data.renoCostHigh,data.renoAdjustPercent,data.riskCount,data.highRisks,data.utmSource,data.utmMedium,data.utmCampaign]);
      return reply_("ok");
    }

    if (data.type === "outcome") {
      var outcome = sheet_(ss, "Outcome", ["Timestamp","Block","Street","Made Offer","Accepted","Final Price","Useful","Email","Comments"]);
      append_(outcome, [data.timestamp || now,data.block,data.street,data.madeOffer,data.accepted,data.finalPrice,data.useful,data.email,data.comments]);
      if (data.finalPrice) notify_("SGHaus Outcome: Blk " + data.block + " " + data.street, "Final price: $" + data.finalPrice + "\nUseful: " + data.useful + "\nComments: " + (data.comments || "none"));
      return reply_("ok");
    }

    if (data.type === "seller_outcome") {
      var seller = sheet_(ss, "Seller Outcome", ["Timestamp","Block","Street","Listed","Sold/Offers","Sale Price","Time to Sell","Useful","Email","Comments"]);
      append_(seller, [data.timestamp || now,data.block,data.street,data.listed,data.sold,data.salePrice,data.timeToSell,data.useful,data.email,data.comments]);
      if (data.salePrice) notify_("SGHaus Seller Outcome: Blk " + data.block + " " + data.street, "Sale price: $" + data.salePrice + "\nUseful: " + data.useful + "\nComments: " + (data.comments || "none"));
      return reply_("ok");
    }

    if (data.type === "contact") {
      if (!isEmail_(data.email)) return reply_("error");
      var contact = sheet_(ss, "Contact", ["Timestamp","Name","Email","Message"]);
      append_(contact, [data.timestamp || now,data.name,data.email,data.message]);
      notify_("SGHaus Contact: " + String(data.name).slice(0, 80), "Name: " + data.name + "\nEmail: " + data.email + "\nMessage:\n" + data.message);
      return reply_("ok");
    }

    if (data.type === "subscribe") {
      if (!isEmail_(data.email)) return reply_("error");
      var subs = ss.getSheetByName("Sheet1") || ss.getSheets()[0];
      var existing = subs.getRange("B:B").getValues().flat();
      if (existing.indexOf(data.email) !== -1) return reply_("ok");
      append_(subs, [data.timestamp || now,data.email,data.source || "website",data.medium,data.campaign,data.content]);
      return reply_("ok");
    }

    if (data.type === "clinic_signup") {
      if (!isEmail_(data.email)) return reply_("error");
      if (data.listingTown && data.consent !== "yes") return reply_("error");
      var clinic = SpreadsheetApp.openById(prop_("CLINIC_SHEET_ID"));
      var signups = sheet_(clinic, "Sign-ups", ["Timestamp","Clinic Date","Name","Email","Language","Listing Town","Listing Flat Type","Listing Block","Asking Price","Question","Consent To Show"]);
      append_(signups, [data.timestamp || now,data.clinicDate,data.name,data.email,data.locale,data.listingTown,data.listingFlatType,data.listingBlock,data.askingPrice,data.question,data.consent]);
      return reply_("ok");
    }

    // Unknown types are rejected; they never fall through to the subscriber list.
    return reply_("error");
  } catch (err) {
    return reply_("error");
  }
}

function notify_(subject, body) {
  var to = prop_("NOTIFY_EMAIL");
  if (to) MailApp.sendEmail({ to: to, subject: subject, body: body });
}

// Run daily from a time-driven trigger (Triggers > Add trigger > purgeOldClinicRows, Day timer).
// Deletes clinic sign-ups 90 days after their clinic date (R22).
function purgeOldClinicRows() {
  var sheet = SpreadsheetApp.openById(prop_("CLINIC_SHEET_ID")).getSheetByName("Sign-ups");
  if (!sheet) return;
  var rows = sheet.getDataRange().getValues();
  var cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  for (var r = rows.length - 1; r >= 1; r--) {
    var clinicDate = new Date(rows[r][1]);
    if (!isNaN(clinicDate.getTime()) && clinicDate < cutoff) sheet.deleteRow(r + 1);
  }
}
