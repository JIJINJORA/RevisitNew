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
    public class SessionTreatmentController : Controller
    {
        string dbName = ConfigurationManager.AppSettings["dbName"].ToString();
        DSessionTreatment objDSession = new DSessionTreatment();

        public ActionResult Index()
        {
            return View();
        }

        public JsonResult SearchProcedures(string term)
        {
            DataSet ds = objDSession.SearchProcedures(term, dbName);
            List<object> list = new List<object>();
            if (ds != null && ds.Tables.Count > 0)
            {
                foreach (DataRow row in ds.Tables[0].Rows)
                {
                    list.Add(new
                    {
                        id = Convert.ToInt32(row["ProcedureId"]),
                        label = row["ProcedureName"].ToString(),
                        value = row["ProcedureName"].ToString()
                    });
                }
            }
            return Json(list, JsonRequestBehavior.AllowGet);
        }

        public JsonResult GetAllProcedures()
        {
            DataSet ds = objDSession.GetAllProcedures(dbName);
            List<object> list = new List<object>();
            if (ds != null && ds.Tables.Count > 0)
            {
                foreach (DataRow row in ds.Tables[0].Rows)
                {
                    list.Add(new
                    {
                        ProcedureId = row["ProcedureId"],
                        ProcedureName = row["ProcedureName"],
                        ProcedureCode = row["ProcedureCode"]
                    });
                }
            }
            return Json(list, JsonRequestBehavior.AllowGet);
        }

        [HttpPost]
        public ActionResult GetTreatments()
        {
            List<SessionTreatmentModel> list = new List<SessionTreatmentModel>();
            DataSet ds = objDSession.GetAllTreatments(dbName);
            if (ds != null && ds.Tables.Count > 0)
            {
                foreach (DataRow row in ds.Tables[0].Rows)
                {
                    list.Add(new SessionTreatmentModel
                    {
                        TreatmentId = Convert.ToInt32(row["TreatmentId"]),
                        TreatmentName = row["TreatmentName"].ToString(),
                        TemplateType = Convert.ToInt32(row["TemplateType"]),
                        NumberOfSessions = row["NumberOfSessions"] == DBNull.Value ? (int?)null : Convert.ToInt32(row["NumberOfSessions"]),
                        DefaultDuration = row["DefaultDuration"] == DBNull.Value ? (decimal?)null : Convert.ToDecimal(row["DefaultDuration"]),
                        IsActive = Convert.ToBoolean(row["IsActive"]),
                        ProcedureId = row.Table.Columns.Contains("ProcedureId") ? Convert.ToInt32(row["ProcedureId"]) : 0
                    });
                }
            }
            return Json(new { data = list });
        }

        public ActionResult Create(int id = 0)
        {
            // Load procedures for dropdown
            DataSet dsProcedures = objDSession.GetProcedures(dbName);
            List<SelectListItem> procedureList = new List<SelectListItem>();
            if (dsProcedures != null && dsProcedures.Tables.Count > 0)
            {
                foreach (DataRow row in dsProcedures.Tables[0].Rows)
                {
                    procedureList.Add(new SelectListItem
                    {
                        Value = row["ProcedureId"].ToString(),
                        Text = row["ProcedureName"].ToString()
                    });
                }
            }
            ViewBag.ProcedureList = new SelectList(procedureList, "Value", "Text");

            SessionTreatmentModel model = new SessionTreatmentModel();
            if (id > 0)
            {
                DataSet ds = objDSession.GetTreatmentById(id, dbName);
                if (ds != null && ds.Tables.Count > 0 && ds.Tables[0].Rows.Count > 0)
                {
                    var row = ds.Tables[0].Rows[0];
                    model.TreatmentId = Convert.ToInt32(row["TreatmentId"]);
                    model.ProcedureId = row.Table.Columns.Contains("ProcedureId") ? Convert.ToInt32(row["ProcedureId"]) : 0;
                    model.TreatmentName = row["TreatmentName"].ToString();
                    model.TemplateType = Convert.ToInt32(row["TemplateType"]);
                    model.NumberOfSessions = row["NumberOfSessions"] == DBNull.Value ? (int?)null : Convert.ToInt32(row["NumberOfSessions"]);
                    model.DefaultDuration = row["DefaultDuration"] == DBNull.Value ? (decimal?)null : Convert.ToDecimal(row["DefaultDuration"]);
                    model.IsActive = Convert.ToBoolean(row["IsActive"]);

                    if (ds.Tables.Count > 1)
                    {
                        foreach (DataRow drow in ds.Tables[1].Rows)
                        {
                            model.Days.Add(new SessionTreatmentDayModel
                            {
                                DayId = Convert.ToInt32(drow["DayId"]),
                                DayOfWeek = Convert.ToInt32(drow["DayOfWeek"]),
                                Duration = Convert.ToDecimal(drow["Duration"]),
                                DisplayOrder = Convert.ToInt32(drow["DisplayOrder"]),
                                Notes = drow["Notes"].ToString(),
                                DayName = GetDayName(Convert.ToInt32(drow["DayOfWeek"]))
                            });
                        }
                    }
                }
            }
            return View(model);
        }

        [HttpPost]
        public ActionResult Create(SessionTreatmentModel model)
        {
            try
            {
                model.ModifiedBy = Session["UserId"] != null ? Convert.ToInt32(Session["UserId"]) : 1;
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
        public ActionResult Delete(int id)
        {
            DataSet result = objDSession.DeleteTreatment(id, dbName);
            if (result != null && result.Tables[0].Rows.Count > 0)
            {
                return Json(new { success = true });
            }
            return Json(new { success = false });
        }

        [HttpPost]
        public ActionResult GetTemplate(int treatmentId)
        {
            DataSet ds = objDSession.GetTreatmentById(treatmentId, dbName);
            if (ds != null && ds.Tables.Count > 0 && ds.Tables[0].Rows.Count > 0)
            {
                var row = ds.Tables[0].Rows[0];
                int type = Convert.ToInt32(row["TemplateType"]);
                if (type == 1)
                {
                    var data = new
                    {
                        type = 1,
                        sessions = row["NumberOfSessions"] == DBNull.Value ? 0 : Convert.ToInt32(row["NumberOfSessions"]),
                        duration = row["DefaultDuration"] == DBNull.Value ? 0 : Convert.ToDecimal(row["DefaultDuration"])
                    };
                    return Json(data);
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
                                duration = Convert.ToDecimal(drow["Duration"])
                            });
                        }
                    }
                    return Json(new { type = 2, days = days });
                }
            }
            return Json(null);
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
                        var data = new
                        {
                            success = true,
                            type = 1,
                            sessions = row["NumberOfSessions"] == DBNull.Value ? 0 : Convert.ToInt32(row["NumberOfSessions"]),
                            duration = row["DefaultDuration"] == DBNull.Value ? 0 : Convert.ToDecimal(row["DefaultDuration"])
                        };
                        return Json(data);
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

        public JsonResult GetProcedureList()
        {
            List<SelectListItem> list = new List<SelectListItem>();
            DataSet ds = objDSession.GetProcedures(dbName);
            if (ds != null && ds.Tables.Count > 0)
            {
                foreach (DataRow row in ds.Tables[0].Rows)
                {
                    list.Add(new SelectListItem
                    {
                        Value = row["ProcedureId"].ToString(),
                        Text = row["ProcedureName"].ToString()
                    });
                }
            }
            return Json(list, JsonRequestBehavior.AllowGet);
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