using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Data;
using System.Data.SqlClient;
using EUMI_ERP.Models;

namespace EUMI_ERP.DataLayer
{
    public class DSession
    {
        private SqlParameter[] arlParms;

        // Search procedures by name (autocomplete)
        // SP: HMS_ProcedureSearch @ProcedureName, @ProcedureId
        public DataSet HMS_ProcedureSearch(SessionModel oModel, string dbName)
        {
            try
            {
                arlParms = new SqlParameter[2];
                arlParms[0] = new SqlParameter("@ProcedureName", oModel.ProcedureName ?? "");
                arlParms[1] = new SqlParameter("@ProcedureId", oModel.ProcedureId.ToString());
                return SQLHelper.ExecuteDataset("HMS_ProcedureSearch", dbName, arlParms);
            }
            catch (SqlException exMe)
            {
                Console.WriteLine(exMe.Message);
                return null;
            }
        }

        // Load header (Table[0]) + day rows (Table[1]) for a patient+procedure
        public DataSet HMS_SessionTreatmentGetandGets(SessionModel oModel, string dbName)
        {
            try
            {
                arlParms = new SqlParameter[2];
                arlParms[0] = new SqlParameter("@RegNo", oModel.RegNo ?? "");
                arlParms[1] = new SqlParameter("@ProcedureId", oModel.ProcedureId);
                return SQLHelper.ExecuteDataset("HMS_SessionTreatmentGetandGets", dbName, arlParms);
            }
            catch (SqlException exMe)
            {
                Console.WriteLine(exMe.Message);
                return null;
            }
        }

        // Replace-pattern save: retires old active rows for RegNo+ProcedureId, inserts fresh snapshot
        public DataSet HMS_SessionTreatmentInsertandUpdate(SessionModel oModel, string dbName)
        {
            arlParms = new SqlParameter[17];
            arlParms[0] = new SqlParameter("@EditorId", oModel.EditorId);
            arlParms[1] = new SqlParameter("@RegNo", oModel.RegNo ?? "");
            arlParms[2] = new SqlParameter("@PatientName", oModel.PatientName ?? "");
            arlParms[3] = new SqlParameter("@AgeSex", oModel.AgeSex ?? "");
            arlParms[4] = new SqlParameter("@DoctorName", oModel.DoctorName ?? "");
            arlParms[5] = new SqlParameter("@Contact", oModel.Contact ?? "");
            arlParms[6] = new SqlParameter("@OPIPNumber", oModel.OPIPNumber ?? "");
            arlParms[7] = new SqlParameter("@ProcedureName", oModel.ProcedureName ?? "");
            arlParms[8] = new SqlParameter("@ProcedureId", oModel.ProcedureId);
            arlParms[9] = new SqlParameter("@Age", oModel.Age ?? "");
            arlParms[10] = new SqlParameter("@Sex", oModel.Sex ?? "");
            arlParms[11] = new SqlParameter("@ContactNo", oModel.ContactNo ?? "");
            arlParms[12] = new SqlParameter("@DoctorId", oModel.DoctorId);
            arlParms[13] = new SqlParameter("@OPNo", oModel.OPNo ?? "");
            arlParms[14] = new SqlParameter("@IPNo", oModel.IPNo ?? "");
            arlParms[15] = new SqlParameter("@CreatedBy", oModel.CreatedBy);
            arlParms[16] = new SqlParameter("@SessionDaysJson", oModel.SessionDaysJson ?? "");
            return SQLHelper.ExecuteDataset("HMS_SessionTreatmentInsertandUpdate", dbName, arlParms);
        }

        public DataSet HMS_SessionTreatmentEditorGetbyProcedure(SessionModel oModel, string dbName)
        {
            try
            {
                arlParms = new SqlParameter[1];
                arlParms[0] = new SqlParameter("@ProcedureId", (int)oModel.ProcedureId);
                return SQLHelper.ExecuteDataset("HMS_SessionTreatmentEditorGetbyProcedure", dbName, arlParms);
            }
            catch (SqlException exMe)
            {
                Console.WriteLine(exMe.Message);
                return null;
            }
        }

        public DataSet HMS_SessionTreatmentEditorSave(SessionModel oModel, string dbName)
        {
            arlParms = new SqlParameter[6];
            arlParms[0] = new SqlParameter("@EditorId", oModel.EditorId);
            arlParms[1] = new SqlParameter("@ProcedureId", (int)oModel.ProcedureId);
            arlParms[2] = new SqlParameter("@ProcedureName", oModel.ProcedureName ?? "");
            arlParms[3] = new SqlParameter("@NoOfSessions", oModel.NoOfSessions);
            arlParms[4] = new SqlParameter("@CreatedBy", oModel.CreatedBy.ToString());   // SP wants NVARCHAR, model has int
            arlParms[5] = new SqlParameter("@DetailsXML", oModel.DetailsXML ?? "<rows></rows>");
            // No try/catch — same pattern as the Form save, let real errors reach the controller
            return SQLHelper.ExecuteDataset("HMS_SessionTreatmentEditorSave", dbName, arlParms);
        }
        public DataSet HMS_SessionTreatmentListView(string DateFrom, string DateTo, string dbName)
        {
            try
            {
                arlParms = new SqlParameter[2];
                arlParms[0] = new SqlParameter("@DateFrom", DateFrom ?? "");
                arlParms[1] = new SqlParameter("@DateTo", DateTo ?? "");
                return SQLHelper.ExecuteDataset("HMS_SessionTreatmentListView", dbName, arlParms);
            }
            catch (SqlException exMe)
            {
                Console.WriteLine(exMe.Message);
                return null;
            }
        }

        // DSession.cs
        public DataSet HMS_TherapistSearch(string searchText, string dbName)
        {
            try
            {
                arlParms = new SqlParameter[1];
                arlParms[0] = new SqlParameter("@SearchText", searchText ?? "");
                return SQLHelper.ExecuteDataset("HMS_TherapistSearch", dbName, arlParms);
            }
            catch (SqlException exMe)
            {
                Console.WriteLine(exMe.Message);
                return null;
            }
        }

        // Soft-delete a single saved day row
        public DataSet HMS_SessionDayDelete(SessionModel oModel, string dbName)
        {
            try
            {
                arlParms = new SqlParameter[2];
                arlParms[0] = new SqlParameter("@RecordID", oModel.RecordID);
                arlParms[1] = new SqlParameter("@CreatedBy", oModel.CreatedBy);
                return SQLHelper.ExecuteDataset("HMS_SessionDayDelete", dbName, arlParms);
            }
            catch (SqlException exMe)
            {
                Console.WriteLine(exMe.Message);
                return null;
            }
        }
    }
}