using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
using System.Data.SqlClient;
using System.Linq;
using System.Web.Mvc;
using EUMI_ERP.Models;

namespace EUMI_ERP.Controllers
{
    public class SessionFormController : Controller
    {
        string dbName = ConfigurationManager.AppSettings["dbName"].ToString();
        DSessionTreatment objDSession = new DSessionTreatment();

        // GET: SessionForm/Session
        public ActionResult Session()
        {
            return View();
        }

        [HttpPost]
        public JsonResult HMS_ProcedureSearch(string ProcedureName)
        {
            try
            {
                DataSet ds = objDSession.SearchProcedures(ProcedureName, dbName);
                List<object> list = new List<object>();
                if (ds != null && ds.Tables.Count > 0)
                {
                    foreach (DataRow row in ds.Tables[0].Rows)
                    {
                        list.Add(new
                        {
                            id = Convert.ToInt32(row["ProcedureId"]),
                            label = row["ProcedureName"].ToString(),
                            value = row["ProcedureName"].ToString(),
                            ProcedureId = Convert.ToInt32(row["ProcedureId"]),
                            ProcedureName = row["ProcedureName"].ToString()
                        });
                    }
                }
                return Json(list, JsonRequestBehavior.AllowGet);
            }
            catch (Exception ex)
            {
                return Json(new { error = ex.Message }, JsonRequestBehavior.AllowGet);
            }
        }

        [HttpPost]
        public ActionResult GetTemplateByProcedure(int procedureId)
        {
            try
            {
                DataSet ds = objDSession.GetTreatmentByProcedureId(procedureId, dbName);
                if (ds != null && ds.Tables.Count > 0 && ds.Tables[0].Rows.Count > 0)
                {
                    var row = ds.Tables[0].Rows[0];
                    int type = Convert.ToInt32(row["TemplateType"]);
                    if (type == 1)
                    {
                        return Json(new
                        {
                            success = true,
                            type = 1,
                            sessions = row["NumberOfSessions"] == DBNull.Value ? 0 : Convert.ToInt32(row["NumberOfSessions"]),
                            duration = row["DefaultDuration"] == DBNull.Value ? 0 : Convert.ToDecimal(row["DefaultDuration"])
                        });
                    }
                    else
                    {
                        List<object> days = new List<object>();
                        if (ds.Tables.Count > 1)
                        {
                            foreach (DataRow drow in ds.Tables[1].Rows)
                            {
                                days.Add(new
                                {
                                    dayOfWeek = Convert.ToInt32(drow["DayOfWeek"]),
                                    dayName = GetDayName(Convert.ToInt32(drow["DayOfWeek"])),
                                    duration = Convert.ToDecimal(drow["Duration"]),
                                    notes = drow["Notes"].ToString()
                                });
                            }
                        }
                        return Json(new
                        {
                            success = true,
                            type = 2,
                            days = days,
                            treatmentId = Convert.ToInt32(row["TreatmentId"])
                        });
                    }
                }
                return Json(new { success = false, message = "No template found for this procedure." });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, error = true, message = ex.Message });
            }
        }

        [HttpPost]
        public ActionResult Create(SessionTreatmentModel model)
        {
            try
            {
                model.ModifiedBy = HttpContext.Session["UserId"] != null
                    ? Convert.ToInt32(HttpContext.Session["UserId"])
                    : 1;

                DataSet result = objDSession.SaveTreatment(model, dbName);
                if (result != null && result.Tables[0].Rows.Count > 0)
                {
                    int newTreatmentId = Convert.ToInt32(result.Tables[0].Rows[0]["TreatmentId"]);
                    return Json(new { success = true, treatmentId = newTreatmentId });
                }
                return Json(new { success = false, message = "Save failed. No response from server." });
            }
            catch (SqlException ex)
            {
                return Json(new { success = false, message = "Database error: " + ex.Message });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = "Error: " + ex.Message });
            }
        }
        [HttpPost]
        public JsonResult GetPatientSessions(string regNo, string patientName)
        {
            try
            {
                // You might want to pass patientId instead, but for now use RegNo + PatientName
                DataSet ds = objDSession.GetSessionsByPatient(regNo, patientName, dbName);
                List<object> sessions = new List<object>();
                if (ds != null && ds.Tables.Count > 0)
                {
                    foreach (DataRow row in ds.Tables[0].Rows)
                    {
                        sessions.Add(new
                        {
                            slNo = row["SLNo"],
                            sessionDate = Convert.ToDateTime(row["SessionDate"]).ToString("yyyy-MM-dd"),
                            hours = row["Hours"],
                            room = row["Room"],
                            therapist = row["TherapistConsultant"],
                            notes = row["Notes"]
                        });
                    }
                }
                return Json(sessions, JsonRequestBehavior.AllowGet);
            }
            catch (Exception ex)
            {
                return Json(new { error = ex.Message });
            }
        }

        [HttpPost]
        public ActionResult SavePatientSession(PatientSessionFormModel model)
        {
            try
            {
                System.Diagnostics.Debug.WriteLine("=== SavePatientSession Called ===");

                if (model == null)
                {
                    System.Diagnostics.Debug.WriteLine("Model is null");
                    return Json(new { success = false, message = "No data received." });
                }

                if (model.Details == null || model.Details.Count == 0)
                {
                    System.Diagnostics.Debug.WriteLine("No details in model");
                    return Json(new { success = false, message = "No session rows provided." });
                }

                // Check for null values in details
                foreach (var detail in model.Details)
                {
                    System.Diagnostics.Debug.WriteLine($"Detail SLNo: {detail.SLNo}, Hours: {detail.Hours}");
                    if (string.IsNullOrEmpty(detail.Hours))
                    {
                        System.Diagnostics.Debug.WriteLine($"Hours is null or empty for SLNo: {detail.SLNo}");
                    }
                }

                if (string.IsNullOrEmpty(model.FormDate))
                    model.FormDate = DateTime.Today.ToString("yyyy-MM-dd");

                System.Diagnostics.Debug.WriteLine($"Attempting to save with dbName: {dbName}");

                objDSession.SavePatientSessionForm(model, dbName);

                System.Diagnostics.Debug.WriteLine("Save completed successfully");
                return Json(new { success = true });
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"Error in SavePatientSession: {ex.Message}");
                System.Diagnostics.Debug.WriteLine($"Stack trace: {ex.StackTrace}");

                // Return the actual error message
                return Json(new { success = false, message = ex.Message });
            }
        }
        private string GetDayName(int dayOfWeek)
        {
            switch (dayOfWeek)
            {
                case 1: return "Monday";
                case 2: return "Tuesday";
                case 3: return "Wednesday";
                case 4: return "Thursday";
                case 5: return "Friday";
                case 6: return "Saturday";
                case 7: return "Sunday";
                default: return "";
            }
        }
    }
}