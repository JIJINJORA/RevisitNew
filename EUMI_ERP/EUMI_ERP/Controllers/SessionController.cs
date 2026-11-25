using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using System.Data;
using System.Configuration;
using EUMI_ERP.Models;

namespace EUMI_ERP.Controllers
{
    public class SessionController : Controller
    {
        string dbName = ConfigurationManager.AppSettings["dbName"].ToString();

        // GET: Session Editor view
        public ActionResult SessionEditor()
        {
            return View();
        }
        public ActionResult SessionForm()
        {
            return View();
        }



        // Autocomplete: search procedures by typed name
        // Returns FLAT array (no wrapper) -- required by custom jquery-ui.js
        // Same pattern as Revisit controller's HMS_ProcedureSearch used by ProcedureBill
        [HttpPost]
        public ActionResult HMS_ProcedureSearch(SessionModel oModel)
        {
            SessionModel obj = new SessionModel();
            List<object> oList = new List<object>();
            try
            {
                DataSet dsDataSet = obj.HMS_ProcedureSearch(oModel, dbName);
                DataTable dt = dsDataSet.Tables[0];

                foreach (DataRow row in dt.Rows)
                {
                    oList.Add(new
                    {
                        ProcedureId = SafeLong(row, "ProcedureId"),
                        ProcedureName = SafeString(row, "ProcedureName"),
                        ProcedureCode = SafeString(row, "ProcedureCode"),
                        Procedurecharge = SafeDecimal(row, dt)
                    });
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine("Message  :" + ex.Message + "+" + ex.StackTrace);
            }
            return Json(oList, JsonRequestBehavior.AllowGet);
        }

        // ── Safe helpers (private to this controller, or move to a shared static class) ──

        private long SafeLong(DataRow row, string col)
        {
            if (!row.Table.Columns.Contains(col) || row[col] == DBNull.Value) return 0;
            long result;
            return long.TryParse(row[col].ToString().Trim(), out result) ? result : 0;
        }

        private string SafeString(DataRow row, string col)
        {
            return (!row.Table.Columns.Contains(col) || row[col] == DBNull.Value) ? "" : row[col].ToString();
        }

        // HMS_ProcedureSearch's SELECT has a duplicate "Procedurecharge" column
        // (ISNULL(Procedurecharge,0)'Procedurecharge' AND the raw column via *).
        // ADO.NET auto-renames the 2nd one to "Procedurecharge1".
        // The aliased ISNULL(...) column is always the safe, non-null one we want.
        // We try "Procedurecharge" first since that's the alias SQL Server keeps as
        // the primary name; if for any reason it's missing, fall back to the raw one.
        private decimal SafeDecimal(DataRow row, DataTable dt)
        {
            string colToUse = dt.Columns.Contains("Procedurecharge") ? "Procedurecharge" : "Procedurecharge1";
            if (row[colToUse] == DBNull.Value) return 0;
            decimal result;
            return decimal.TryParse(row[colToUse].ToString().Trim(), out result) ? result : 0;
        }
        // Load header + day rows for a patient+procedure
        [HttpPost]
        public ActionResult HMS_SessionTreatmentGetandGets(string RegNo, long ProcedureId)
        {
            SessionModel obj = new SessionModel();
            List<SessionModel> oHeaderList = new List<SessionModel>();
            List<SessionModel> oDayList = new List<SessionModel>();
            try
            {
                SessionModel oModel = new SessionModel();
                oModel.RegNo = RegNo;
                oModel.ProcedureId = ProcedureId;

                DataSet dsDataSet = obj.HMS_SessionTreatmentGetandGets(oModel, dbName);

                // Table[0] = header
                foreach (DataRow row in dsDataSet.Tables[0].Rows)
                {
                    SessionModel MModels = new SessionModel();
                    MModels.RegNo = SessionModel.ToSafeString(row["RegNo"]);
                    MModels.PatientName = SessionModel.ToSafeString(row["PatientName"]);
                    MModels.AgeSex = SessionModel.ToSafeString(row["AgeSex"]);
                    MModels.DoctorName = SessionModel.ToSafeString(row["DoctorName"]);
                    MModels.Contact = SessionModel.ToSafeString(row["Contact"]);
                    MModels.OPIPNumber = SessionModel.ToSafeString(row["OPIPNumber"]);
                    MModels.ProcedureName = SessionModel.ToSafeString(row["ProcedureName"]);
                    MModels.ProcedureId = SessionModel.ToSafeLong(row["ProcedureId"]);
                    MModels.Age = SessionModel.ToSafeString(row["Age"]);
                    MModels.Sex = SessionModel.ToSafeString(row["Sex"]);
                    MModels.ContactNo = SessionModel.ToSafeString(row["ContactNo"]);
                    MModels.DoctorId = SessionModel.ToSafeInt(row["DoctorId"]);
                    MModels.OPNo = SessionModel.ToSafeString(row["OPNo"]);
                    MModels.IPNo = SessionModel.ToSafeString(row["IPNo"]);
                    oHeaderList.Add(MModels);
                }

                // Table[1] = day rows
                if (dsDataSet.Tables.Count > 1)
                {
                    foreach (DataRow row in dsDataSet.Tables[1].Rows)
                    {
                        SessionModel MModels = new SessionModel();
                        MModels.RecordID = SessionModel.ToSafeLong(row["RecordID"]);
                        MModels.SLNo = SessionModel.ToSafeInt(row["SLNo"]);
                        MModels.SessionDate = row["SessionDate"] == DBNull.Value
    ? ""
    : Convert.ToDateTime(row["SessionDate"]).ToString("dd/MM/yyyy");
                        MModels.Hours = SessionModel.ToSafeDecimal(row["Hours"]);
                        MModels.Room = SessionModel.ToSafeString(row["Room"]);
                        MModels.TherapistConsultant = SessionModel.ToSafeString(row["TherapistConsultant"]);
                        MModels.Notes = SessionModel.ToSafeString(row["Notes"]);
                        oDayList.Add(MModels);
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine("Message  :" + ex.Message + "+" + ex.StackTrace);
            }
            return Json(new { oHeaderList, oDayList, success = true }, JsonRequestBehavior.AllowGet);
        }

        // Save / Update (replace-pattern snapshot per RegNo+ProcedureId)
        [HttpPost]
        public ActionResult HMS_SessionTreatmentInsertandUpdate(SessionModel oModel)
        {
            SessionModel obj = new SessionModel();
            List<SessionModel> oList = new List<SessionModel>();
            bool success = true;
            string errorMsg = "";
            try
            {
                DataSet dsDataSet = obj.HMS_SessionTreatmentInsertandUpdate(oModel, dbName);
                foreach (DataRow row in dsDataSet.Tables[0].Rows)
                {
                    SessionModel MModels = new SessionModel();
                    MModels.Status = SessionModel.ToSafeString(row["Status"]);
                    MModels.RegNo = SessionModel.ToSafeString(row["RegNo"]);
                    MModels.ProcedureId = SessionModel.ToSafeLong(row["ProcedureId"]);
                    oList.Add(MModels);
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine("Message  :" + ex.Message + "+" + ex.StackTrace);
                success = false;
                errorMsg = ex.Message;
            }
            return Json(new { oList, success, errorMsg }, JsonRequestBehavior.AllowGet);
        }

        [HttpPost]
        public ActionResult HMS_SessionTreatmentEditorGetbyProcedure(SessionModel oModel)
        {
            SessionModel obj = new SessionModel();
            SessionModel oHeader = new SessionModel();
            List<SessionModel> oDetailList = new List<SessionModel>();
            try
            {
                DataSet dsDataSet = obj.HMS_SessionTreatmentEditorGetbyProcedure(oModel, dbName);

                if (dsDataSet.Tables[0].Rows.Count > 0)
                {
                    DataRow row = dsDataSet.Tables[0].Rows[0];
                    oHeader.EditorId = SessionModel.ToSafeInt(row["EditorId"]);
                    oHeader.ProcedureId = SessionModel.ToSafeLong(row["ProcedureId"]);
                    oHeader.ProcedureName = SessionModel.ToSafeString(row["ProcedureName"]);
                    oHeader.ProcedureCode = SessionModel.ToSafeString(row["ProcedureCode"]);
                    oHeader.NoOfSessions = SessionModel.ToSafeInt(row["NoOfSessions"]);
                }

                if (dsDataSet.Tables.Count > 1)
                {
                    foreach (DataRow row in dsDataSet.Tables[1].Rows)
                    {
                        SessionModel d = new SessionModel();
                        d.DetailId = SessionModel.ToSafeInt(row["DetailId"]);
                        d.SLNo = SessionModel.ToSafeInt(row["SlNo"]);
                        d.AfterDays = SessionModel.ToSafeInt(row["AfterDays"]);
                        d.Duration = SessionModel.ToSafeDecimal(row["DurationHours"]);
                        d.Notes = SessionModel.ToSafeString(row["Notes"]);
                        oDetailList.Add(d);
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine("Message  :" + ex.Message + "+" + ex.StackTrace);
            }
            return Json(new { oHeader, oDetailList, success = true }, JsonRequestBehavior.AllowGet);
        }

        [HttpPost]
        public ActionResult HMS_SessionTreatmentEditorSave(SessionModel oModel)
        {
            SessionModel obj = new SessionModel();
            bool success = true;
            string status = "";
            int newEditorId = 0;
            try
            {
                // SessionDaysJson rows arrive as: DayId~SessionNum~Duration~Notes  (DayId is ignored —
                // EditorSave does a full delete-then-reinsert of details per EditorId, so no per-row id needed)
                var xmlBuilder = new System.Text.StringBuilder("<rows>");
                if (!string.IsNullOrEmpty(oModel.SessionDaysJson))
                {
                    int sl = 1;
                    foreach (var r in oModel.SessionDaysJson.Split('|'))
                    {
                        if (string.IsNullOrWhiteSpace(r)) continue;
                        var parts = r.Split('~');
                        string sessNum = parts.Length > 1 ? parts[1] : "0";
                        string duration = parts.Length > 2 ? parts[2] : "0";
                        string notes = parts.Length > 3
                            ? parts[3].Replace("&", "&amp;").Replace("<", "&lt;").Replace(">", "&gt;").Replace("\"", "&quot;")
                            : "";
                        xmlBuilder.Append("<row SlNo=\"" + sl + "\" AfterDays=\"" + sessNum +
                                           "\" DurationHours=\"" + duration + "\" Notes=\"" + notes + "\" />");
                        sl++;
                    }
                }
                xmlBuilder.Append("</rows>");
                oModel.DetailsXML = xmlBuilder.ToString();

                DataSet ds = obj.HMS_SessionTreatmentEditorSave(oModel, dbName);
                if (ds.Tables[0].Rows.Count > 0)
                {
                    newEditorId = SessionModel.ToSafeInt(ds.Tables[0].Rows[0]["EditorId"]);
                    status = SessionModel.ToSafeString(ds.Tables[0].Rows[0]["Status"]);
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine("Message  :" + ex.Message + "+" + ex.StackTrace);
                success = false;
                status = ex.Message;
            }
            return Json(new { EditorId = newEditorId, Status = status, success }, JsonRequestBehavior.AllowGet);
        }
        [HttpPost]
        public ActionResult HMS_SessionTreatmentListView(string DateFrom, string DateTo)
        {
            SessionModel obj = new SessionModel();
            List<object> oList = new List<object>();
            try
            {
                DataSet ds = obj.HMS_SessionTreatmentListView(DateFrom, DateTo, dbName);
                foreach (DataRow row in ds.Tables[0].Rows)
                {
                    oList.Add(new
                    {
                        RegNo = SessionModel.ToSafeString(row["RegNo"]),
                        PatientName = SessionModel.ToSafeString(row["PatientName"]),
                        ProcedureName = SessionModel.ToSafeString(row["ProcedureName"]),
                        ProcedureId = SessionModel.ToSafeLong(row["ProcedureId"]),
                        DoctorName = SessionModel.ToSafeString(row["DoctorName"]),
                        FromDate = row["FromDate"] == DBNull.Value ? "" : Convert.ToDateTime(row["FromDate"]).ToString("dd/MM/yyyy"),
                        ToDate = row["ToDate"] == DBNull.Value ? "" : Convert.ToDateTime(row["ToDate"]).ToString("dd/MM/yyyy"),
                        TotalDays = SessionModel.ToSafeInt(row["TotalDays"])
                    });
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine("Message  :" + ex.Message + "+" + ex.StackTrace);
            }
            return Json(new { oList, success = true }, JsonRequestBehavior.AllowGet);
        }

        [HttpPost]
public ActionResult HMS_TherapistSearch(string SearchText)
{
    SessionModel obj = new SessionModel();
    List<object> oList = new List<object>();
    try
    {
        DataSet ds = obj.HMS_TherapistSearch(SearchText, dbName);
        foreach (DataRow row in ds.Tables[0].Rows)
        {
            oList.Add(new
            {
                NurseId = SafeLong(row, "NurseId"),
                Name = SafeString(row, "Name")   // matches the "AS Name" alias in the SP
            });
        }
    }
    catch (Exception ex)
    {
        Console.WriteLine("Message  :" + ex.Message + "+" + ex.StackTrace);
    }
    return Json(oList, JsonRequestBehavior.AllowGet);
}

        // Soft-delete a single saved day row
        [HttpPost]
        public ActionResult HMS_SessionDayDelete(SessionModel oModel)
        {
            SessionModel obj = new SessionModel();
            List<SessionModel> oList = new List<SessionModel>();
            try
            {
                DataSet dsDataSet = obj.HMS_SessionDayDelete(oModel, dbName);
                foreach (DataRow row in dsDataSet.Tables[0].Rows)
                {
                    SessionModel MModels = new SessionModel();
                    MModels.Status = row["Status"].ToString();
                    oList.Add(MModels);
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine("Message  :" + ex.Message + "+" + ex.StackTrace);
            }
            return Json(new { oList, success = true }, JsonRequestBehavior.AllowGet);
        }
    }
}