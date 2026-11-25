using EUMI_ERP.DataLayer;
using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Web;

namespace EUMI_ERP.Models
{
    public class CRMModel
    {
        // ===== PRIMARY KEY =====
        public long EnquiryId { get; set; }

        // ===== PATIENT DETAILS =====
        public string PatientName { get; set; }
        public string CompanyName { get; set; }
        public string Mobile { get; set; }
        public string Email { get; set; }

        public string Location { get; set; }

        // ===== ENQUIRY DETAILS =====
        public string EnquiryDate { get; set; }
        public string Source { get; set; }
        public string Stage { get; set; }
        public string Temperature { get; set; }
        public string TreatmentInquired { get; set; }
        public string HandoverNote { get; set; }
        public string Notes { get; set; }

        // ===== FOLLOW-UP =====
        public string FollowupDate { get; set; }
        public string FollowupRemarks { get; set; }
        public string NextFollowupDate { get; set; }

        // ===== STATUS =====
        public string Status { get; set; }
        public int DelFlag { get; set; }
        public long Flag { get; set; }

        // ===== SYSTEM =====
        public long UserId { get; set; }
        public long DeptId { get; set; }

        // ===== SEARCH / FILTER =====
        public string FromDate { get; set; }
        public string ToDate { get; set; }
        public string SearchText { get; set; }
        public string FilterSource { get; set; }
        public string FilterRank { get; set; }

        // ===== DASHBOARD =====
        public string Title { get; set; }
        public long TotalEnquiries { get; set; }
        public long TotalAppointments { get; set; }
        public long FollowupsToday { get; set; }
        public long HotCount { get; set; }
        public long WarmCount { get; set; }
        public long ColdCount { get; set; }
        public string Amount1 { get; set; }
        public string Amount2 { get; set; }

        // ===== CALL LOG =====
        public long LogId { get; set; }
        public string LogRemarks { get; set; }
        public string LogDate { get; set; }
        public string LogTemperature { get; set; }
        public string CallerName { get; set; }

        public string AppointmentDate { get; set; }

        public string CreatedDate { get; set; }

        // ===== LEAD ASSIGNMENT =====
        public long? AssignedToUserId { get; set; }
        public string AssignedToName { get; set; }
        public string EnquiryIdList { get; set; } // '#' delimited list for bulk assign

        public string Name { get; set; } // for staff list
        // ===== DATA LAYER INSTANCE =====
        DCRM oDCRM = new DCRM();

        // ===== MODEL METHODS =====

        public DataSet CRM_CallLogGetByEnquiry(CRMModel model, string dbName)
        {
            return oDCRM.CRM_CallLogGetByEnquiry(model, dbName);
        }

        public DataSet CRM_EnquiryInsertandUpdate(CRMModel model, string dbName)
        {
            return oDCRM.CRM_EnquiryInsertandUpdate(model, dbName);
        }

        public DataSet CRM_EnquiryGetandGets(CRMModel model, string dbName)
        {
            return oDCRM.CRM_EnquiryGetandGets(model, dbName);
        }

        public DataSet CRM_EnquiryDelete(CRMModel model, string dbName)
        {
            return oDCRM.CRM_EnquiryDelete(model, dbName);
        }

        public DataSet CRM_CallLogInsert(CRMModel model, string dbName)
        {
            return oDCRM.CRM_CallLogInsert(model, dbName);
        }

        public DataSet CRM_CallLogGetandGets(CRMModel model, string dbName)
        {
            return oDCRM.CRM_CallLogGetandGets(model, dbName);
        }

        public DataSet CRM_DashboardWidgets(CRMModel model, string dbName)
        {
            return oDCRM.CRM_DashboardWidgets(model, dbName);
        }

        public DataSet CRM_DashboardGraph(CRMModel model, string dbName)
        {
            return oDCRM.CRM_DashboardGraph(model, dbName);
        }

        public DataSet CRM_FollowupBoard(CRMModel model, string dbName)
        {
            return oDCRM.CRM_FollowupBoard(model, dbName);
        }

        public DataSet CRM_UpdateTemperature(CRMModel model, string dbName)
        {
            return oDCRM.CRM_UpdateTemperature(model, dbName);
        }

        public DataSet CRM_ProcedureSearch(string searchTerm, string dbName)
        {
            return oDCRM.CRM_ProcedureSearch(searchTerm, dbName);
        }

        public DataSet CRM_TodayFollowups(CRMModel model, string dbName)
        {
            return oDCRM.CRM_TodayFollowups(model, dbName);
        }

        public DataSet CRM_AreaSearch(string searchTerm, string dbName)
        {
            return oDCRM.CRM_AreaSearch(searchTerm, dbName);
        }

        public DataSet CRM_AssignLeads(CRMModel model, string dbName)
        {
            return oDCRM.CRM_AssignLeads(model, dbName);
        }

        public DataSet CRM_GetStaffList(string dbName)
        {
            return oDCRM.CRM_GetStaffList(dbName);
        }
    }
}
    
