using System;
using System.Collections.Generic;

namespace EUMI_ERP.Models
{
    public class PatientSessionFormModel
    {
        public string FormDate { get; set; }          // ← changed from DateTime to string
        public string RegNo { get; set; }
        public string PatientName { get; set; }
        public string AgeSex { get; set; }
        public string DoctorName { get; set; }
        public string Contact { get; set; }
        public string OPIPNumber { get; set; }
        public string ProcedureName { get; set; }
        public int ProcedureId { get; set; }

        public List<PatientSessionDetailModel> Details { get; set; }
            = new List<PatientSessionDetailModel>();   // ← initialized to prevent null
    }

    public class PatientSessionDetailModel
    {
        public int SLNo { get; set; }
        public string SessionDate { get; set; }       // ← changed from DateTime to string
        public string Hours { get; set; }
        public string Room { get; set; }
        public string TherapistConsultant { get; set; }
        public string Notes { get; set; }
    }
}