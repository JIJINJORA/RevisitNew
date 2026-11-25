using System;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;
using System.Linq;
using System.Web;
using EUMI_ERP.Models;

namespace EUMI_ERP.DataLayer
{
    public class DCRM
    {
        private SqlParameter[] arlParms;

        public DataSet CRM_EnquiryInsertandUpdate(CRMModel model, string dbName)
        {
            try
            {
                arlParms = new SqlParameter[19];
                arlParms[0] = new SqlParameter("@EnquiryId", model.EnquiryId);
                arlParms[1] = new SqlParameter("@PatientName", model.PatientName);
                arlParms[2] = new SqlParameter("@CompanyName", model.CompanyName);
                arlParms[3] = new SqlParameter("@Mobile", model.Mobile);
                arlParms[4] = new SqlParameter("@Email", model.Email);
                arlParms[5] = new SqlParameter("@Location", model.Location ?? "");
                arlParms[6] = new SqlParameter("@EnquiryDate", model.EnquiryDate);
                arlParms[7] = new SqlParameter("@Source", model.Source);
                arlParms[8] = new SqlParameter("@Stage", model.Stage);
                arlParms[9] = new SqlParameter("@Temperature", model.Temperature);
                arlParms[10] = new SqlParameter("@TreatmentInquired", model.TreatmentInquired);
                arlParms[11] = new SqlParameter("@HandoverNote", model.HandoverNote);
                arlParms[12] = new SqlParameter("@Notes", model.Notes);
                arlParms[13] = new SqlParameter("@FollowupDate", model.FollowupDate);
                arlParms[14] = new SqlParameter("@DelFlag", model.DelFlag);
                arlParms[15] = new SqlParameter("@UserId", model.UserId);
                arlParms[16] = new SqlParameter("@DeptId", model.DeptId);
                arlParms[17] = new SqlParameter("@Flag", model.Flag);
                arlParms[18] = new SqlParameter("@AssignedToUserId", (object)model.AssignedToUserId ?? DBNull.Value);


                return SQLHelper.ExecuteDataset(
                    "CRM_EnquiryInsertandUpdate", dbName, arlParms);
            }
            catch (SqlException ex)
            {
                Console.WriteLine(ex.Message);
                return null;
            }
        }

        public DataSet CRM_EnquiryGetandGets(CRMModel model, string dbName)
        {
            try
            {
                arlParms = new SqlParameter[7];
                arlParms[0] = new SqlParameter("@EnquiryId", model.EnquiryId);
                arlParms[1] = new SqlParameter("@FromDate", model.FromDate);
                arlParms[2] = new SqlParameter("@ToDate", model.ToDate);
                arlParms[3] = new SqlParameter("@SearchText", model.SearchText);
                arlParms[4] = new SqlParameter("@FilterSource", model.FilterSource);
                arlParms[5] = new SqlParameter("@DeptId", model.DeptId);
                arlParms[6] = new SqlParameter("@Flag", model.Flag);

                return SQLHelper.ExecuteDataset(
                    "CRM_EnquiryGetandGets", dbName, arlParms);
            }
            catch (SqlException ex)
            {
                Console.WriteLine(ex.Message);
                return null;
            }
        }

        public DataSet CRM_EnquiryDelete(CRMModel model, string dbName)
        {
            try
            {
                arlParms = new SqlParameter[3];
                arlParms[0] = new SqlParameter("@EnquiryId", model.EnquiryId);
                arlParms[1] = new SqlParameter("@UserId", model.UserId);
                arlParms[2] = new SqlParameter("@DeptId", model.DeptId);

                return SQLHelper.ExecuteDataset(
                    "CRM_EnquiryDelete", dbName, arlParms);
            }
            catch (SqlException ex)
            {
                Console.WriteLine(ex.Message);
                return null;
            }
        }

        // REPLACE existing CRM_CallLogInsert method
        public DataSet CRM_CallLogInsert(CRMModel model, string dbName)
        {
            try
            {
                arlParms = new SqlParameter[10];  // was 9, now 10
                arlParms[0] = new SqlParameter("@LogId", model.LogId);
                arlParms[1] = new SqlParameter("@EnquiryId", model.EnquiryId);
                arlParms[2] = new SqlParameter("@LogRemarks", model.LogRemarks ?? "");
                arlParms[3] = new SqlParameter("@LogDate", model.LogDate ?? "");
                arlParms[4] = new SqlParameter("@NextFollowupDate", model.NextFollowupDate ?? "");
                arlParms[5] = new SqlParameter("@LogTemperature", model.LogTemperature ?? "");
                arlParms[6] = new SqlParameter("@UserId", model.UserId);
                arlParms[7] = new SqlParameter("@DeptId", model.DeptId);
                arlParms[8] = new SqlParameter("@AppointmentDate", model.AppointmentDate ?? "");
                arlParms[9] = new SqlParameter("@TreatmentInquired", model.TreatmentInquired ?? ""); // NEW

                return SQLHelper.ExecuteDataset(
                    "CRM_CallLogInsert", dbName, arlParms);
            }
            catch (SqlException ex)
            {
                Console.WriteLine(ex.Message);
                return null;
            }
        }

        // ADD this new method
        public DataSet CRM_CallLogGetByEnquiry(CRMModel model, string dbName)
        {
            try
            {
                arlParms = new SqlParameter[2];
                arlParms[0] = new SqlParameter("@EnquiryId", model.EnquiryId);
                arlParms[1] = new SqlParameter("@DeptId", model.DeptId);

                return SQLHelper.ExecuteDataset(
                    "CRM_CallLogGetByEnquiry", dbName, arlParms);
            }
            catch (SqlException ex)
            {
                Console.WriteLine(ex.Message);
                return null;
            }
        }

        public DataSet CRM_CallLogGetandGets(CRMModel model, string dbName)
        {
            try
            {
                arlParms = new SqlParameter[2];
                arlParms[0] = new SqlParameter("@EnquiryId", model.EnquiryId);
                arlParms[1] = new SqlParameter("@DeptId", model.DeptId);

                return SQLHelper.ExecuteDataset(
                    "CRM_CallLogGetandGets", dbName, arlParms);
            }
            catch (SqlException ex)
            {
                Console.WriteLine(ex.Message);
                return null;
            }
        }

        public DataSet CRM_DashboardWidgets(CRMModel model, string dbName)
        {
            try
            {
                arlParms = new SqlParameter[4];
                arlParms[0] = new SqlParameter("@FromDate", model.FromDate);
                arlParms[1] = new SqlParameter("@ToDate", model.ToDate);
                arlParms[2] = new SqlParameter("@DeptId", model.DeptId);
                arlParms[3] = new SqlParameter("@UserId", model.UserId);

                return SQLHelper.ExecuteDataset(
                    "CRM_DashboardWidgets", dbName, arlParms);
            }
            catch (SqlException ex)
            {
                Console.WriteLine(ex.Message);
                return null;
            }
        }

        public DataSet CRM_DashboardGraph(CRMModel model, string dbName)
        {
            try
            {
                arlParms = new SqlParameter[4];
                arlParms[0] = new SqlParameter("@FromDate", model.FromDate);
                arlParms[1] = new SqlParameter("@ToDate", model.ToDate);
                arlParms[2] = new SqlParameter("@DeptId", model.DeptId);
                arlParms[3] = new SqlParameter("@Flag", model.Flag);

                return SQLHelper.ExecuteDataset(
                    "CRM_DashboardGraph", dbName, arlParms);
            }
            catch (SqlException ex)
            {
                Console.WriteLine(ex.Message);
                return null;
            }
        }

        public DataSet CRM_FollowupBoard(CRMModel model, string dbName)
        {
            try
            {
                arlParms = new SqlParameter[5];
                arlParms[0] = new SqlParameter("@FilterRank", model.FilterRank);
                arlParms[1] = new SqlParameter("@SearchText", model.SearchText);
                arlParms[2] = new SqlParameter("@FromDate", model.FromDate);
                arlParms[3] = new SqlParameter("@ToDate", model.ToDate);
                arlParms[4] = new SqlParameter("@DeptId", model.DeptId);

                return SQLHelper.ExecuteDataset(
                    "CRM_FollowupBoard", dbName, arlParms);
            }
            catch (SqlException ex)
            {
                Console.WriteLine(ex.Message);
                return null;
            }
        }

        public DataSet CRM_UpdateTemperature(CRMModel model, string dbName)
        {
            try
            {
                arlParms = new SqlParameter[4];
                arlParms[0] = new SqlParameter("@EnquiryId", model.EnquiryId);
                arlParms[1] = new SqlParameter("@Temperature", model.Temperature);
                arlParms[2] = new SqlParameter("@UserId", model.UserId);
                arlParms[3] = new SqlParameter("@DeptId", model.DeptId);

                return SQLHelper.ExecuteDataset(
                    "CRM_UpdateTemperature", dbName, arlParms);
            }
            catch (SqlException ex)
            {
                Console.WriteLine(ex.Message);
                return null;
            }
        }

        public DataSet CRM_ProcedureSearch(string searchTerm, string dbName)
        {
            try
            {
                SqlParameter[] parms = new SqlParameter[1];
                parms[0] = new SqlParameter("@SearchTerm", searchTerm ?? "");

                return SQLHelper.ExecuteDataset(
                    "sp_Procedure_Search", dbName, parms);
            }
            catch (SqlException ex)
            {
                Console.WriteLine(ex.Message);
                return null;
            }
        }

        public DataSet CRM_AreaSearch(string searchTerm, string dbName)
        {
            try
            {
                SqlParameter[] parms = new SqlParameter[1];
                parms[0] = new SqlParameter("@SearchTerm", searchTerm ?? "");

                return SQLHelper.ExecuteDataset(
                    "CRM_AreaSearch", dbName, parms);
            }
            catch (SqlException ex)
            {
                Console.WriteLine(ex.Message);
                return null;
            }
        }
        public DataSet CRM_TodayFollowups(CRMModel model, string dbName)
        {
            try
            {
                arlParms = new SqlParameter[3];
                arlParms[0] = new SqlParameter("@ToDay", model.FromDate);
                arlParms[1] = new SqlParameter("@DeptId", model.DeptId);
                arlParms[2] = new SqlParameter("@UserId", model.UserId);

                return SQLHelper.ExecuteDataset(
                    "CRM_TodayFollowups", dbName, arlParms);
            }
            catch (SqlException ex)
            {
                Console.WriteLine(ex.Message);
                return null;
            }
        }

        public DataSet CRM_AssignLeads(CRMModel model, string dbName)
        {
            try
            {
                arlParms = new SqlParameter[4];
                arlParms[0] = new SqlParameter("@EnquiryIdList", model.EnquiryIdList);
                arlParms[1] = new SqlParameter("@AssignedToUserId", model.AssignedToUserId);
                arlParms[2] = new SqlParameter("@UserId", model.UserId);
                arlParms[3] = new SqlParameter("@DeptId", model.DeptId);

                return SQLHelper.ExecuteDataset(
                    "CRM_AssignLeads", dbName, arlParms);
            }
            catch (SqlException ex)
            {
                Console.WriteLine(ex.Message);
                return null;
            }
        }

        public DataSet CRM_GetStaffList(string dbName)
        {
            try
            {
                return SQLHelper.ExecuteDataset(
                    "CRM_GetStaffList", dbName, new SqlParameter[0]);
            }
            catch (SqlException ex)
            {
                Console.WriteLine(ex.Message);
                return null;
            }
        }
    }
}
    