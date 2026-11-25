using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
using System.Data.SqlClient;
using EUMI_ERP.Models;

namespace EUMI_ERP
{
    public class DSessionTreatment
    {
        private SqlParameter[] arlParms;

        private DataTable GetDaysDataTable(List<SessionTreatmentDayModel> days)
        {
            DataTable dt = new DataTable();
            dt.Columns.Add("DayOfWeek", typeof(int));
            dt.Columns.Add("Duration", typeof(decimal));
            dt.Columns.Add("Notes", typeof(string));
            dt.Columns.Add("DisplayOrder", typeof(int));

            foreach (var day in days)
            {
                dt.Rows.Add(day.DayOfWeek, day.Duration, day.Notes ?? "", day.DisplayOrder);
            }
            return dt;
        }

        public DataSet SaveTreatment(SessionTreatmentModel model, string dbName)
        {
            try
            {
                SqlParameter treatmentIdParam = new SqlParameter("@TreatmentId", model.TreatmentId);
                treatmentIdParam.Direction = ParameterDirection.InputOutput;

                SqlParameter[] param = new SqlParameter[]
                {
                    treatmentIdParam,
                    new SqlParameter("@ProcedureId", model.ProcedureId),
                    new SqlParameter("@TreatmentName", model.TreatmentName),
                    new SqlParameter("@TemplateType", model.TemplateType),
                    new SqlParameter("@NumberOfSessions", (object)model.NumberOfSessions ?? DBNull.Value),
                    new SqlParameter("@DefaultDuration", (object)model.DefaultDuration ?? DBNull.Value),
                    new SqlParameter("@IsActive", model.IsActive),
                    new SqlParameter("@ModifiedBy", model.ModifiedBy ?? 1),
                    new SqlParameter("@Days", SqlDbType.Structured)
                    {
                        TypeName = "dbo.TreatmentDayType",
                        Value = GetDaysDataTable(model.Days)
                    }
                };
                DataSet ds = SQLHelper.ExecuteDataset("SessionTreatment_SaveandUpdate", dbName, param);
                return ds;
            }
            catch (Exception ex)
            {
                throw;
            }
        }

        public DataSet SearchProcedures(string searchTerm, string dbName)
        {
            try
            {
                SqlParameter[] param = new SqlParameter[]
                {
                    new SqlParameter("@SearchTerm", searchTerm ?? "")
                };
                return SQLHelper.ExecuteDataset("sp_Procedure_Search", dbName, param);
            }
            catch (Exception ex)
            {
                throw;
            }
        }

        public DataSet GetAllTreatments(string dbName)
        {
            try
            {
                return SQLHelper.ExecuteDataset("SessionTreatment_GetAll", dbName);
            }
            catch (Exception ex)
            {
                throw;
            }
        }

        public DataSet GetAllProcedures(string dbName)
        {
            try
            {
                return SQLHelper.ExecuteDataset("sp_Procedure_GetAll", dbName);
            }
            catch (Exception ex)
            {
                throw;
            }
        }

        public DataSet GetTreatmentById(int treatmentId, string dbName)
        {
            try
            {
                arlParms = new SqlParameter[1];
                arlParms[0] = new SqlParameter("@TreatmentId", treatmentId);
                return SQLHelper.ExecuteDataset("SessionTreatment_GetById", dbName, arlParms);
            }
            catch (Exception ex)
            {
                throw;
            }
        }

        public DataSet DeleteTreatment(int treatmentId, string dbName)
        {
            try
            {
                arlParms = new SqlParameter[1];
                arlParms[0] = new SqlParameter("@TreatmentId", treatmentId);
                return SQLHelper.ExecuteDataset("SessionTreatment_Delete", dbName, arlParms);
            }
            catch (Exception ex)
            {
                throw;
            }
        }

        public DataSet GetProcedures(string dbName)
        {
            try
            {
                return SQLHelper.ExecuteDataset("Procedure_GetActive", dbName);
            }
            catch (Exception ex)
            {
                throw;
            }
        }

        public DataSet GetTreatmentByProcedureId(int procedureId, string dbName)
        {
            try
            {
                SqlParameter[] param = new SqlParameter[]
                {
                    new SqlParameter("@ProcedureId", procedureId)
                };
                return SQLHelper.ExecuteDataset("sp_SessionTreatment_GetByProcedureId", dbName, param);
            }
            catch (Exception ex)
            {
                throw;
            }
        }

        public int InsertProcedure(string procedureName, string procedureCode, decimal procedureCharge, string dbName)
        {
            try
            {
                SqlParameter[] param = new SqlParameter[]
                {
                    new SqlParameter("@ProcedureName", procedureName),
                    new SqlParameter("@ProcedureCode", procedureCode),
                    new SqlParameter("@ProcedureCharge", procedureCharge),
                    new SqlParameter("@DelFlag", 1)
                };
                DataSet ds = SQLHelper.ExecuteDataset("sp_Procedure_Insert", dbName, param);
                if (ds != null && ds.Tables[0].Rows.Count > 0)
                {
                    return Convert.ToInt32(ds.Tables[0].Rows[0][0]);
                }
                throw new Exception("Failed to insert procedure.");
            }
            catch (Exception ex)
            {
                throw;
            }
        }

        public DataSet GetSessionsByPatient(string regNo, string patientName, string dbName)
        {
            try
            {
                SqlParameter[] param = new SqlParameter[]
                {
                    new SqlParameter("@RegNo", regNo ?? ""),
                    new SqlParameter("@PatientName", patientName ?? "")
                };
                return SQLHelper.ExecuteDataset("HMS_SessionTreatmentForm_GetByPatient", dbName, param);
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"Error in GetSessionsByPatient: {ex.Message}");
                DataSet ds = new DataSet();
                ds.Tables.Add(new DataTable());
                return ds;
            }
        }

        public void SavePatientSessionForm(PatientSessionFormModel formData, string dbName)
        {
            // --- Null / empty guards ---
            if (formData == null)
                throw new ArgumentNullException(nameof(formData), "Form data is null");

            if (formData.Details == null)
                throw new ArgumentNullException(nameof(formData.Details), "Details collection is null");

            if (formData.Details.Count == 0)
                throw new InvalidOperationException("No details to save");

            // --- Resolve connection string safely ---
            var csEntry = ConfigurationManager.ConnectionStrings[dbName];
            if (csEntry == null)
                throw new InvalidOperationException(
                    $"Connection string '{dbName}' not found in web.config. " +
                    $"Please add <add name=\"{dbName}\" connectionString=\"...\" /> under <connectionStrings>.");

            string connectionString = csEntry.ConnectionString;

            // --- Save each session row inside a transaction ---
            using (SqlConnection conn = new SqlConnection(connectionString))
            {
                conn.Open();
                SqlTransaction transaction = conn.BeginTransaction();
                try
                {
                    foreach (var detail in formData.Details)
                    {
                        DateTime formDate = DateTime.Parse(formData.FormDate);
                        DateTime sessionDate = DateTime.Parse(detail.SessionDate);

                        using (SqlCommand cmd = new SqlCommand("HMS_SessionTreatmentForm_Insert", conn, transaction))
                        {
                            cmd.CommandType = CommandType.StoredProcedure;

                            cmd.Parameters.AddWithValue("@FormDate", formDate);
                            cmd.Parameters.AddWithValue("@RegNo", (object)formData.RegNo ?? DBNull.Value);
                            cmd.Parameters.AddWithValue("@PatientName", (object)formData.PatientName ?? DBNull.Value);
                            cmd.Parameters.AddWithValue("@AgeSex", (object)formData.AgeSex ?? DBNull.Value);
                            cmd.Parameters.AddWithValue("@DoctorName", (object)formData.DoctorName ?? DBNull.Value);
                            cmd.Parameters.AddWithValue("@Contact", (object)formData.Contact ?? DBNull.Value);
                            cmd.Parameters.AddWithValue("@OPIPNumber", (object)formData.OPIPNumber ?? DBNull.Value);
                            cmd.Parameters.AddWithValue("@ProcedureName", (object)formData.ProcedureName ?? DBNull.Value);
                            cmd.Parameters.AddWithValue("@SLNo", detail.SLNo);
                            cmd.Parameters.AddWithValue("@SessionDate", sessionDate);
                            cmd.Parameters.AddWithValue("@Hours", (object)detail.Hours ?? DBNull.Value);
                            cmd.Parameters.AddWithValue("@Room", (object)detail.Room ?? DBNull.Value);
                            cmd.Parameters.AddWithValue("@TherapistConsultant", (object)detail.TherapistConsultant ?? DBNull.Value);
                            cmd.Parameters.AddWithValue("@Notes", (object)detail.Notes ?? DBNull.Value);

                            cmd.ExecuteNonQuery();
                        }
                    }

                    transaction.Commit();
                }
                catch
                {
                    transaction.Rollback();
                    throw;
                }
            }
        }
    }
}