using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using System.Data;
using EUMI_ERP.Models;
using System.Configuration;

namespace EUMI_ERP.Controllers
{
    public class TestMappingController : Controller
    {

        string dbName = ConfigurationManager.AppSettings["dbName"].ToString();

        public ActionResult Index()
        {
            return View();
        }

        [HttpGet]
        public ActionResult HMS_HospitalTestRateGet(int HospitalId)
        {
            HMSTest obj = new HMSTest();
            List<HMSTest> oList = new List<HMSTest>();

            try
            {
                DataSet dsDataSet = new DataSet();

                dsDataSet = obj.HospitalTestRateGet(HospitalId, dbName);

                if (dsDataSet != null && dsDataSet.Tables.Count > 0)
                {
                    foreach (DataRow row in dsDataSet.Tables[0].Rows)
                    {
                        HMSTest model = new HMSTest();

                        model.TestId = Convert.ToInt32(row["TestId"]);
                        model.TestName = row["TestName"].ToString();
                        model.MedDeptName = row["Department"].ToString();
                        model.Rate = Convert.ToDecimal(row["Rate"]);
                        model.SpRate = Convert.ToDecimal(row["SpecialRate"]);

                        oList.Add(model);
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex.Message);
            }

            return Json(new { oList = oList, success = true }, JsonRequestBehavior.AllowGet);
        }
        [HttpPost]
        public JsonResult HospitalTestRateInsertUpdate(List<HMSTest> HMSTest)
        {
            HMSTest obj = new HMSTest();

            DataTable dt = new DataTable();

            dt.Columns.Add("HospitalId");
            dt.Columns.Add("TestId");
            dt.Columns.Add("SpecialRate");

            foreach (var item in HMSTest)
            {
                dt.Rows.Add(
                item.HospitalId,
                item.TestId,
                item.SpRate
                );
            }

            var dsDataSet = obj.HospitalTestRateInsertUpdate(dt, dbName);
            var result = dsDataSet.Tables[0].Rows[0]["Status"].ToString();

            if (result == "SUCCESS")
                return Json(new { success = true });
            else
                return Json(new { success = false });
        }
    }
}