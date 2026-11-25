using EUMI_ERP.Models;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace EUMI_ERP.Controllers
{
    public class CRMController : Controller
    {
        string dbName = ConfigurationManager.AppSettings["dbName"].ToString();

        public ActionResult CRMIndex()
        {
            return View();
        }

        // ===== DASHBOARD WIDGETS =====
        public ActionResult CRM_DashboardWidgets(CRMModel model)
        {
            CRMModel obj = new CRMModel();
            List<CRMModel> oList = new List<CRMModel>();
            try
            {
                DataSet ds = obj.CRM_DashboardWidgets(model, dbName);
                if (ds != null && ds.Tables.Count > 0)
                {
                    foreach (DataRow row in ds.Tables[0].Rows)
                    {
                        CRMModel m = new CRMModel();
                        m.TotalEnquiries = Convert.ToInt64(row["TotalEnquiries"].ToString());
                        m.TotalAppointments = Convert.ToInt64(row["TotalAppointments"].ToString());
                        m.FollowupsToday = Convert.ToInt64(row["FollowupsToday"].ToString());
                        m.HotCount = Convert.ToInt64(row["HotCount"].ToString());
                        m.WarmCount = Convert.ToInt64(row["WarmCount"].ToString());
                        m.ColdCount = Convert.ToInt64(row["ColdCount"].ToString());
                        m.Amount1 = row["GrowthEnq"].ToString();
                        m.Amount2 = row["GrowthApp"].ToString();
                        oList.Add(m);
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex.Message);
            }
            return Json(new { oList, success = true },
                        JsonRequestBehavior.AllowGet);
        }

        // ===== DASHBOARD GRAPH =====
        public ActionResult CRM_DashboardGraph(CRMModel model)
        {
            CRMModel obj = new CRMModel();
            List<CRMModel> oList = new List<CRMModel>();
            List<CRMModel> oList2 = new List<CRMModel>();
            try
            {
                DataSet ds = obj.CRM_DashboardGraph(model, dbName);

                // Table 0 - Bar chart (Enquiry vs Appointment) - weekly
                if (ds != null && ds.Tables.Count > 0)
                {
                    foreach (DataRow row in ds.Tables[0].Rows)
                    {
                        CRMModel m = new CRMModel();
                        m.Title = row["Title"].ToString();    // ← was "MonthLabel"
                        m.Amount1 = row["Amount1"].ToString();  // ← was "EnqCount"
                        m.Amount2 = row["Amount2"].ToString();  // ← was "AppCount"
                        oList.Add(m);
                    }
                }

                // Table 1 - Donut chart (Source breakdown)
                if (ds != null && ds.Tables.Count > 1)
                {
                    foreach (DataRow row in ds.Tables[1].Rows)
                    {
                        CRMModel m = new CRMModel();
                        m.Title = row["Title"].ToString();    // ← was "Source"
                        m.Amount1 = row["Amount1"].ToString();  // ← was "SourceCount"
                        oList2.Add(m);
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex.Message);
            }
            return Json(new { oList, oList2, success = true },
                        JsonRequestBehavior.AllowGet);
        }

        // ===== ENQUIRY INSERT / UPDATE =====
        public ActionResult CRM_EnquiryInsertandUpdate(CRMModel model)
        {
            CRMModel obj = new CRMModel();
            List<CRMModel> oList = new List<CRMModel>();
            try
            {
                DataSet ds = obj.CRM_EnquiryInsertandUpdate(model, dbName);
                if (ds != null && ds.Tables.Count > 0)
                {
                    foreach (DataRow row in ds.Tables[0].Rows)
                    {
                        CRMModel m = new CRMModel();
                        m.Status = row["Status"].ToString();
                        m.EnquiryId = Convert.ToInt64(row["EnquiryId"].ToString());
                        oList.Add(m);
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex.Message);
            }
            return Json(new { oList, success = true },
                        JsonRequestBehavior.AllowGet);
        }

        // ===== ENQUIRY GET =====
        public ActionResult CRM_EnquiryGetandGets(CRMModel model)
        {
            CRMModel obj = new CRMModel();
            List<CRMModel> oList = new List<CRMModel>();
            try
            {
                DataSet ds = obj.CRM_EnquiryGetandGets(model, dbName);
                if (ds != null && ds.Tables.Count > 0)
                {
                    foreach (DataRow row in ds.Tables[0].Rows)
                    {
                        CRMModel m = new CRMModel();
                        m.EnquiryId = Convert.ToInt64(row["EnquiryId"].ToString());
                        m.PatientName = row["PatientName"].ToString();
                        m.CompanyName = row["CompanyName"].ToString();
                        m.Mobile = row["Mobile"].ToString();
                        m.Email = row["Email"].ToString();
                        m.Location = row["Location"].ToString();
                        m.EnquiryDate = row["EnquiryDate"].ToString();
                        m.Source = row["Source"].ToString();
                        m.Stage = row["Stage"].ToString();
                        m
                            
                            .Temperature = row["Temperature"].ToString();
                        m.TreatmentInquired = row["TreatmentInquired"].ToString();
                        m.HandoverNote = row["HandoverNote"].ToString();
                        m.Notes = row["Notes"].ToString();
                        m.FollowupDate = row["FollowupDate"].ToString();
                        m.Status = row["Status"].ToString();
                        m.AssignedToUserId = row.Table.Columns.Contains("AssignedToUserId") && row["AssignedToUserId"] != DBNull.Value
                            ? Convert.ToInt64(row["AssignedToUserId"]) : (long?)null;
                        m.AssignedToName = row.Table.Columns.Contains("AssignedToName") ? row["AssignedToName"].ToString() : "";
                        oList.Add(m);
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex.Message);
            }
            return new JsonResult()
            {
                Data = new { oList, success = true },
                MaxJsonLength = 86753090
            };
        }

        // ===== ENQUIRY DELETE =====
        public ActionResult CRM_EnquiryDelete(CRMModel model)
        {
            CRMModel obj = new CRMModel();
            List<CRMModel> oList = new List<CRMModel>();
            try
            {
                DataSet ds = obj.CRM_EnquiryDelete(model, dbName);
                if (ds != null && ds.Tables.Count > 0)
                {
                    foreach (DataRow row in ds.Tables[0].Rows)
                    {
                        CRMModel m = new CRMModel();
                        m.Status = row["Status"].ToString();
                        oList.Add(m);
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex.Message);
            }
            return Json(new { oList, success = true },
                        JsonRequestBehavior.AllowGet);
        }

        // ===== CALL LOG INSERT =====
        public ActionResult CRM_CallLogInsert(CRMModel model)
        {
            CRMModel obj = new CRMModel();
            List<CRMModel> oList = new List<CRMModel>();
            try
            {
                DataSet ds = obj.CRM_CallLogInsert(model, dbName);
                if (ds != null && ds.Tables.Count > 0)
                {
                    foreach (DataRow row in ds.Tables[0].Rows)
                    {
                        CRMModel m = new CRMModel();
                        m.Status = row["Status"].ToString();
                        m.LogId = Convert.ToInt64(row["LogId"].ToString());
                        oList.Add(m);
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex.Message);
            }
            return Json(new { oList, success = true },
                        JsonRequestBehavior.AllowGet);
        }

        // ===== CALL LOG GET =====
        public ActionResult CRM_CallLogGetandGets(CRMModel model)
        {
            CRMModel obj = new CRMModel();
            List<CRMModel> oList = new List<CRMModel>();
            try
            {
                DataSet ds = obj.CRM_CallLogGetandGets(model, dbName);
                if (ds != null && ds.Tables.Count > 0)
                {
                    foreach (DataRow row in ds.Tables[0].Rows)
                    {
                        CRMModel m = new CRMModel();
                        m.LogId = Convert.ToInt64(row["LogId"].ToString());
                        m.LogRemarks = row["LogRemarks"].ToString();
                        m.LogDate = row["LogDate"].ToString();
                        m.LogTemperature = row["LogTemperature"].ToString();
                        m.CallerName = row["CallerName"].ToString();
                        oList.Add(m);
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex.Message);
            }
            return Json(new { oList, success = true },
                        JsonRequestBehavior.AllowGet);
        }

        // ===== FOLLOWUP BOARD =====
        public ActionResult CRM_FollowupBoard(CRMModel model)
        {
            CRMModel obj = new CRMModel();
            List<CRMModel> oList = new List<CRMModel>();
            try
            {
                DataSet ds = obj.CRM_FollowupBoard(model, dbName);
                if (ds != null && ds.Tables.Count > 0)
                {
                    foreach (DataRow row in ds.Tables[0].Rows)
                    {
                        CRMModel m = new CRMModel();
                        m.EnquiryId = Convert.ToInt64(row["EnquiryId"].ToString());
                        m.PatientName = row["PatientName"].ToString();
                        m.CompanyName = row["CompanyName"].ToString();
                        m.Mobile = row["Mobile"].ToString();
                        m.Email = row["Email"].ToString();
                        m.Source = row["Source"].ToString();
                        m.Temperature = row["Temperature"].ToString();
                        m.TreatmentInquired = row["TreatmentInquired"].ToString();
                        m.Notes = row["Notes"].ToString();
                        m.HandoverNote = row["HandoverNote"].ToString();
                        m.FollowupDate = row["FollowupDate"].ToString();
                        m.Stage = row["Stage"].ToString();
                        m.Status = row["Status"].ToString();
                        m.AssignedToUserId = row.Table.Columns.Contains("AssignedToUserId") && row["AssignedToUserId"] != DBNull.Value
                            ? Convert.ToInt64(row["AssignedToUserId"]) : (long?)null;
                        m.AssignedToName = row.Table.Columns.Contains("AssignedToName") ? row["AssignedToName"].ToString() : "";
                        oList.Add(m);
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex.Message);
            }
            return new JsonResult()
            {
                Data = new { oList, success = true },
                MaxJsonLength = 86753090
            };
        }

        // ===== UPDATE TEMPERATURE =====
        public ActionResult CRM_UpdateTemperature(CRMModel model)
        {
            CRMModel obj = new CRMModel();
            List<CRMModel> oList = new List<CRMModel>();
            try
            {
                DataSet ds = obj.CRM_UpdateTemperature(model, dbName);
                if (ds != null && ds.Tables.Count > 0)
                {
                    foreach (DataRow row in ds.Tables[0].Rows)
                    {
                        CRMModel m = new CRMModel();
                        m.Status = row["Status"].ToString();
                        oList.Add(m);
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex.Message);
            }
            return Json(new { oList, success = true },
                        JsonRequestBehavior.AllowGet);
        }

        // ===== CALL LOG GET BY ENQUIRY =====
        public ActionResult CRM_CallLogGetByEnquiry(CRMModel model)
        {
            CRMModel obj = new CRMModel();
            List<CRMModel> oList = new List<CRMModel>();
            try
            {
                DataSet ds = obj.CRM_CallLogGetByEnquiry(model, dbName);
                if (ds != null && ds.Tables.Count > 0)
                {
                    foreach (DataRow row in ds.Tables[0].Rows)
                    {
                        CRMModel m = new CRMModel();
                        m.LogId = Convert.ToInt64(row["LogId"].ToString());
                        m.EnquiryId = Convert.ToInt64(row["EnquiryId"].ToString());
                        m.LogRemarks = row["LogRemarks"].ToString();
                        m.LogDate = row["LogDate"].ToString();
                        m.NextFollowupDate = row["NextFollowupDate"].ToString();
                        m.LogTemperature = row["LogTemperature"].ToString();
                        m.AppointmentDate = row["AppointmentDate"].ToString();
                        m.TreatmentInquired = row["TreatmentInquired"].ToString();
                        m.CreatedDate = row["CreatedDate"].ToString();
                        oList.Add(m);
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex.Message);
            }
            return Json(new { oList, success = true },
                        JsonRequestBehavior.AllowGet);
        }

        // ===== PROCEDURE AUTOCOMPLETE (Treatment Inquired) =====
        public ActionResult CRM_ProcedureSearch(string searchTerm)
        {
            CRMModel obj = new CRMModel();
            List<CRMModel> oList = new List<CRMModel>();
            try
            {
                DataSet ds = obj.CRM_ProcedureSearch(searchTerm, dbName);
                if (ds != null && ds.Tables.Count > 0)
                {
                    foreach (DataRow row in ds.Tables[0].Rows)
                    {
                        CRMModel m = new CRMModel();
                        m.Title = row["ProcedureName"].ToString();
                        oList.Add(m);
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex.Message);
            }
            return Json(new { oList, success = true },
                        JsonRequestBehavior.AllowGet);
        }

        // ===== AREA AUTOCOMPLETE (Location) =====
        public ActionResult CRM_AreaSearch(string searchTerm)
        {
            CRMModel obj = new CRMModel();
            List<CRMModel> oList = new List<CRMModel>();
            try
            {
                DataSet ds = obj.CRM_AreaSearch(searchTerm, dbName);
                if (ds != null && ds.Tables.Count > 0)
                {
                    foreach (DataRow row in ds.Tables[0].Rows)
                    {
                        CRMModel m = new CRMModel();
                        m.Title = row["Name"].ToString(); // adjust column name to match Area table
                        oList.Add(m);
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex.Message);
            }
            return Json(new { oList, success = true },
                        JsonRequestBehavior.AllowGet);
        }

        // ===== ASSIGN LEADS (BULK) =====
        public ActionResult CRM_AssignLeads(CRMModel model)
        {
            CRMModel obj = new CRMModel();
            List<CRMModel> oList = new List<CRMModel>();
            try
            {
                DataSet ds = obj.CRM_AssignLeads(model, dbName);
                if (ds != null && ds.Tables.Count > 0)
                {
                    foreach (DataRow row in ds.Tables[0].Rows)
                    {
                        CRMModel m = new CRMModel();
                        m.Status = row["Status"].ToString();
                        oList.Add(m);
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex.Message);
            }
            return Json(new { oList, success = true },
                        JsonRequestBehavior.AllowGet);
        }

        // ===== STAFF LIST (FOR ASSIGN DROPDOWN) =====
        public ActionResult CRM_GetStaffList()
        {
            CRMModel obj = new CRMModel();
            List<CRMModel> oList = new List<CRMModel>();
            try
            {
                DataSet ds = obj.CRM_GetStaffList(dbName);
                if (ds != null && ds.Tables.Count > 0)
                {
                    foreach (DataRow row in ds.Tables[0].Rows)
                    {
                        CRMModel m = new CRMModel();
                        m.UserId = Convert.ToInt64(row["UserId"].ToString());
                        m.Name = row["Name"].ToString();
                        oList.Add(m);
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex.Message);
            }
            return Json(new { oList, success = true },
                        JsonRequestBehavior.AllowGet);
        }

        // ===== TODAY FOLLOWUPS =====
        public ActionResult CRM_TodayFollowups(CRMModel model)
        {
            CRMModel obj = new CRMModel();
            List<CRMModel> oList = new List<CRMModel>();
            try
            {
                DataSet ds = obj.CRM_TodayFollowups(model, dbName);
                if (ds != null && ds.Tables.Count > 0)
                {
                    foreach (DataRow row in ds.Tables[0].Rows)
                    {
                        CRMModel m = new CRMModel();
                        m.EnquiryId = Convert.ToInt64(row["EnquiryId"].ToString());
                        m.PatientName = row["PatientName"].ToString();
                        m.Mobile = row["Mobile"].ToString();
                        m.FollowupDate = row["FollowupDate"].ToString();
                        m.Temperature = row["Temperature"].ToString();
                        oList.Add(m);
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex.Message);
            }
            return Json(new { oList, success = true },
                        JsonRequestBehavior.AllowGet);
        }
    }
}