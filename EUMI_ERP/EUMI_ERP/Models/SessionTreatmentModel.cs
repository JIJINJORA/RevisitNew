using System;
using System.Collections.Generic;

namespace EUMI_ERP.Models
{
    public class SessionTreatmentModel
    {
        public int TreatmentId { get; set; }
        public int ProcedureId { get; set; }          // <-- add this line
        public string TreatmentName { get; set; }
        public int TemplateType { get; set; } // 1=Count, 2=Day
        public int? NumberOfSessions { get; set; }
        public decimal? DefaultDuration { get; set; }
        public bool IsActive { get; set; }
        public int? CreatedBy { get; set; }
        public int? ModifiedBy { get; set; }
        public List<SessionTreatmentDayModel> Days { get; set; }

        public SessionTreatmentModel()
        {
            Days = new List<SessionTreatmentDayModel>();
        }
    }

    public class SessionTreatmentDayModel
    {
        public int DayId { get; set; }
        public int TreatmentId { get; set; }
        public int DayOfWeek { get; set; }
        public string DayName { get; set; } // for display
        public decimal Duration { get; set; }
        public int DisplayOrder { get; set; }
        public string Notes { get; set; }
        public int? SessionNumber { get; set; }
    }
}