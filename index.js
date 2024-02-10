const PDFDocument = require("pdfkit");
const fs = require("fs");
const express = require("express");
const { default: axios } = require("axios");
const codes = require("rescode");
const dayjs = require("dayjs");

const app = express();

const generatePdf = async (order, user) => {
    // Create a document
    const doc = new PDFDocument({
        size: [297.64, 500],
        margins: {
            top: 10,
            bottom: 10,
            left: 10,
            right: 10,
        },
    });

    const dash_path = "dash.png";
    const dash_path_height = 5;

    // logo
    if (user.business.invoice_logo) {
        // make the logo a readable buffer
        const response = await axios({
            method: "get",
            url: user.business.invoice_logo,
            responseType: "arraybuffer",
        });

        const logoBuffer = response.data;

        // Add an image, constrain it to a given size, and center it vertically and horizontally
        doc.image(logoBuffer, doc.page.width / 2 - 50 / 2, doc.y, {
            height: 40,
        });
    } else {
        doc.text(user.business.name, { align: "center" }).fontSize(25);
    }

    // address
    if (user.business.invoice_show_address) {
        doc.fontSize(10);
        doc.moveDown(0.2);
        doc.text(order.branch.address, { align: "center" });
    }

    // phone number
    if (user.business.invoice_show_contact_number) {
        doc.fontSize(10);
        doc.moveDown(0.1);
        doc.text(`Phone: ${order.branch.contact_number}`, { align: "center" });
    }

    // bin id and mushak
    if (user.business.bin_id && user.business.invoice_show_mushak) {
        doc.fontSize(10);
        doc.moveDown(0.1);
        doc.text(`BIN: ${user.business.bin_id} | MUSHAK 6.3`, { align: "center" });
    } else if (user.business.bin_id && !user.business.invoice_show_mushak) {
        doc.fontSize(10);
        doc.moveDown(0.1);
        doc.text(`BIN: ${user.business.bin_id}`, { align: "center" });
    }

    // website and email
    if (user.business.invoice_website && user.business.invoice_email) {
        doc.fontSize(10);
        doc.moveDown(0.1);
        doc.text(`${user.business.invoice_website} | ${user.business.invoice_email}`, { align: "center" });
    } else if (user.business.invoice_website && !user.business.invoice_email) {
        doc.fontSize(10);
        doc.moveDown(0.1);
        doc.text(`${user.business.invoice_website}`, { align: "center" });
    } else if (!user.business.invoice_website && user.business.invoice_email) {
        doc.fontSize(10);
        doc.moveDown(0.1);
        doc.text(`${user.business.invoice_email}`, { align: "center" });
    }

    // dashed line
    doc.moveDown(0.1);
    doc.image(dash_path, { height: dash_path_height, width: 277.64, x: 10 });

    // note
    doc.moveDown(0.2);
    doc.fontSize(10);
    doc.text("Note:", { align: "left" });

    // table no
    if (user.business.invoice_show_table) {
        doc.fontSize(12);
        doc.moveDown(0.15);
        doc.text(`Table: ${order.table ? order.table.name : "N/A"}`, { align: "left" });
    }

    // order id
    doc.fontSize(11);
    doc.moveDown(0.15);
    doc.text(`Order: ${order.id}`, { align: "left" });

    // dashed line for guest bill
    doc.moveDown(0.1);
    doc.image(dash_path, { height: dash_path_height, width: 277.64, x: 10 });
    doc.moveDown(0.3);
    doc.text("Guest Bill", { align: "left" });

    // cashier name
    if (user.business.invoice_show_cashier_name) {
        doc.fontSize(11);
        doc.moveDown(0.1);
        doc.text(`Cashier Name: ${order.cashier_name ?? "N/A"}`, { align: "left" });
    }

    // date and time
    doc.fontSize(11);
    doc.moveDown(0.2);
    doc.text(`Date: ${dayjs(order.created_at).format("DD-MMM-YYYY")}`, { align: "left" });
    doc.fontSize(11);
    doc.moveUp(1);
    doc.text(`Time: ${dayjs(order.created_at).format("hh:mm A")}`, { align: "right" });

    // show number of guests
    if (user.business.invoice_show_number_of_guests) {
        doc.fontSize(11);
        doc.moveDown(0.2);
        doc.text(`Number of Guests: N/A`, { align: "left" });
    }

    // order items header
    doc.moveDown(0.1);
    doc.image(dash_path, { height: dash_path_height, width: 277.64, x: 10 });

    doc.moveDown(0.25);
    doc.text("Qty", { align: "left" });
    doc.moveUp(1);
    doc.text("Item Name", 55);
    doc.moveUp(1);
    doc.text("Price", 190);
    doc.moveUp(1);
    doc.text("Total Price", { align: "right" });

    doc.image(dash_path, { height: dash_path_height, width: 277.64, x: 10 });

    // order items
    order.order_items.forEach((item) => {
        doc.fontSize(10);
        doc.moveDown(0.5);
        doc.text(item.qty, 15);
        doc.moveUp(1);
        doc.text(item.product_name, 55);
        doc.moveUp(1);
        doc.text(item.order_time_price, 190);
        doc.moveUp(1);
        doc.text(`${(parseFloat(item.order_time_price) * item.qty).toFixed(2)}`, { align: "right" });
    });

    // double dashed line
    doc.moveDown(0.1);
    doc.image(dash_path, { height: dash_path_height, width: 277.64, x: 10 });
    doc.moveUp(0.2);
    doc.image(dash_path, { height: dash_path_height, width: 277.64, x: 10 });

    // net total
    doc.fontSize(12);
    doc.moveDown(0.3);
    doc.text(`Net Total:`, 10);
    doc.fontSize(11);
    doc.moveUp(1);
    doc.text(order.sub_total, { align: "right" });

    // double dashed line
    doc.image(dash_path, { height: dash_path_height, width: 277.64, x: 10 });
    doc.moveUp(0.2);
    doc.image(dash_path, { height: dash_path_height, width: 277.64, x: 10 });

    // include the VAT
    doc.fontSize(11);
    doc.moveDown(0.3);
    doc.text(`Included:`, { align: "left" });

    doc.fontSize(11);
    doc.moveDown(0.1);
    doc.text(`Service Charge:`, { align: "left" });
    doc.fontSize(11);
    doc.moveUp(1);
    doc.text(order.service_fee, { align: "right" });
    doc.fontSize(11);
    doc.moveDown(0.1);
    doc.text(`VAT:`, { align: "left" });
    doc.fontSize(11);
    doc.moveUp(1);
    doc.text(order.vat, { align: "right" });

    // double dashed line
    doc.image(dash_path, { height: dash_path_height, width: 277.64, x: 10 });
    doc.moveUp(0.2);
    doc.image(dash_path, { height: dash_path_height, width: 277.64, x: 10 });

    // gross total
    doc.fontSize(12);
    doc.moveDown(0.4);
    doc.text(`GROSS Total:`, 10);
    doc.fontSize(11);
    doc.moveUp(1);
    doc.text(order.total, { align: "right" });

    // double dashed line
    doc.image(dash_path, { height: dash_path_height, width: 277.64, x: 10 });
    doc.moveUp(0.2);
    doc.image(dash_path, { height: dash_path_height, width: 277.64, x: 10 });

    // barcode
    codes.loadModules(["code128"]);
    const barcode = codes.create("code128", order.id);
    doc.moveDown(0.5);
    doc.image(barcode, doc.page.width / 2 - 70, doc.y, {
        height: 40,
    });
    doc.moveDown(0.4);
    if (user.business.invoice_extra_text) {
        doc.text(user.business.invoice_extra_text, { align: "center" });
    }
    doc.text(`Powered By: BizSolution, bizsolution.io`, { align: "center" });

    // end doc and return it
    doc.end();

    return doc;
};

app.post("/print", async (req, res) => {
    // order details
    const order = {
        id: "3278207ED6",
        payment_method: null,
        table: {
            id: 1,
            branch: {
                id: 2,
                name: "Dhanmondi",
                address: "Road 15",
                contact_number: "01774261661",
                notes: "Secondary",
                created_at: "2023-11-28T09:20:54.353801+06:00",
                updated_at: "2023-12-11T19:06:42.892557+06:00",
                business: 1,
            },
            name: "VPXMT1",
            created_at: "2023-11-28T09:22:08.650716+06:00",
            updated_at: "2023-11-28T09:22:08.652028+06:00",
            business: 1,
        },
        terminal: null,
        branch: {
            id: 5,
            name: "Amulia",
            address: "Demra, Amulia",
            contact_number: "01774261660",
            notes: "",
            created_at: "2023-12-19T23:33:49.214703+06:00",
            updated_at: "2024-01-15T16:37:33.926337+06:00",
            business: 1,
        },
        order_items: [
            {
                id: 101,
                variant: {
                    id: 16,
                    sku: "17018843998664801",
                    name: null,
                    price: "80.00",
                    is_active: true,
                    created_at: "2023-12-06T23:49:41.215419+06:00",
                    updated_at: "2023-12-06T23:49:41.215821+06:00",
                    product: 19,
                },
                modifiers: [],
                sku: "17018843998664801",
                product_name: "Brownie",
                variant_name: null,
                order_time_price: "80.00",
                discount: "0.00",
                qty: 1,
                vat: "0.00",
                order: "3278207ED6",
            },
            {
                id: 102,
                variant: {
                    id: 30,
                    sku: "6971308457077",
                    name: null,
                    price: "150.00",
                    is_active: true,
                    created_at: "2023-12-14T18:42:25.769952+06:00",
                    updated_at: "2023-12-14T18:42:25.770180+06:00",
                    product: 22,
                },
                modifiers: [],
                sku: "6971308457077",
                product_name: "Virgin Mojito",
                variant_name: null,
                order_time_price: "125.00",
                discount: "0.00",
                qty: 1,
                vat: "5.00",
                order: "3278207ED6",
            },
        ],
        cashier: {
            id: 3,
            username: "shamim.owner",
            name: "Shamim Owner",
            role: "owner",
            branch: null,
            dp: null,
        },
        customer: {
            id: 19,
            name: "Cus-gehxOVRH",
            phone_number: null,
            address: null,
            city: null,
            zone: null,
            pathao_city_id: null,
            pathao_zone_id: null,
            reward_points: 0,
            created_at: "2024-01-29T19:02:08.612062+06:00",
            updated_at: "2024-01-29T19:02:08.612366+06:00",
            business: 1,
        },
        sub_total: "205.00",
        discount: "0.00",
        delivery_charge: "0.00",
        service_fee: "25.00",
        parking_fee: "0.00",
        vat: "6.25",
        total: "236.25",
        payment_status: "due",
        payment_method_name: null,
        payment_method_ref: null,
        cash_collected: null,
        change_amount: null,
        is_closed: false,
        order_type: "Dine In",
        cashier_name: "Shamim Owner",
        sales_person_name: null,
        address: "Any address",
        city: null,
        zone: null,
        pathao_city_id: null,
        pathao_zone_id: null,
        courier_name: null,
        courier_tracking_id: null,
        notes: null,
        is_voided: false,
        created_at: "2024-01-29T19:02:07+06:00",
        updated_at: "2024-01-29T19:02:08.643198+06:00",
        sales_person: null,
        business: 1,
    };

    // user
    const user = {
        id: 17,
        business: {
            id: 3,
            name: "Biz Tech eCom",
            logo: null,
            type: "ecommerce",
            vat_type: "exclusive",
            default_vat_rate: "0.00",
            service_fee: false,
            default_service_fee: "0.00",
            parking_fee: false,
            // invoice_logo: null,
            invoice_logo: "https://c9devstorage.blob.core.windows.net/c9-pos/c9-pos-f544c2d3-b087-4b3b-9178-f457da94dc7c-jpeg",
            invoice_show_address: true,
            invoice_show_contact_number: true,
            bin_id: "12345",
            invoice_show_mushak: true,
            invoice_show_cashier_name: true,
            invoice_show_table: false,
            invoice_show_number_of_guests: false,
            invoice_website: null,
            invoice_extra_text: "Thanks for your order!",
            invoice_email: null,
            pathao_integrated: true,
            max_branch: 2,
            sms_credit: 0,
            enable_electronic_invoice: false,
        },
        branch: null,
        last_login: "2024-02-07T18:53:51.209269+06:00",
        is_superuser: false,
        username: "ecom.owner",
        phone_number: null,
        name: "eCom Owner",
        dp: null,
        role: "owner",
        last_session: "2024-02-06T21:52:17.243752+06:00",
        email: null,
        created_at: "2024-01-30T22:11:21+06:00",
        updated_at: "2024-02-06T21:52:17.244151+06:00",
        is_staff: false,
        is_active: true,
        terminal: null,
        groups: [],
        user_permissions: [],
    };

    // call generatePdf function
    const doc = await generatePdf(order, user);

    // See below for browser usage
    doc.pipe(fs.createWriteStream("output.pdf"));
    // doc.pipe(res);

    // return success
    res.status(200).json({
        message: "success",
    });
});

app.listen(8080, () => {
    console.log("Server started on port 8080");
});
