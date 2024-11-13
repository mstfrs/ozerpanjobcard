import frappe

@frappe.whitelist()
def add_opt_no_to_work_orders(production_plan, opt_no):
    # Production Plan’dan üretilen Work Order'ları bulun
    work_orders = frappe.get_all("Work Order", filters={"production_plan": production_plan}, fields=["name"])

    for wo in work_orders:
        # Work Order'da custom_opti_no alanını güncelle
        work_order = frappe.get_doc("Work Order", wo.name)
        work_order.custom_opti_no = opt_no
        work_order.save()

        # İş Kartlarına custom_opti_no değerini ekleyin
        job_cards = frappe.get_all("Job Card", filters={"work_order": wo.name}, fields=["name"])
        for jc in job_cards:
            job_card = frappe.get_doc("Job Card", jc.name)
            job_card.custom_opti_no = opt_no
            job_card.save()


def set_opt_no_for_work_order(doc, method):
    # Eğer Work Order bir Production Plan'dan türetilmişse
    if doc.production_plan:
        # Production Plan'dan custom_opti_no değerini alın
        production_plan = frappe.get_doc("Production Plan", doc.production_plan)
        doc.custom_opti_no = production_plan.custom_opti_no

def set_opt_no_for_job_card(doc, method):
    # Eğer Job Card bir Work Order'dan türetilmişse
    if doc.work_order:
        # Work Order'dan custom_opti_no değerini alın
        work_order = frappe.get_doc("Work Order", doc.work_order)
        doc.custom_opti_no = work_order.custom_opti_no
