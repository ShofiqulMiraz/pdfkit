const PDFDocument = require("pdfkit");
const fs = require("fs");
const express = require("express");
const { default: axios } = require("axios");
const codes = require("rescode");
const { log } = require("console");

const app = express();

const generatePdf = async (payload) => {
    const {
        logo,
        name,
        show_address,
        address,
        show_phone_number,
        phone_number,
        binId,
        showMushak,
        website,
        email,
        show_table,
        table_no,
        order_id,
        showCashierName,
        cashierName,
        createdAt,
        numberOfGuests,
        showNumberOfGuests,
    } = payload;

    const orderItemsLength = 5;

    // Create a document
    const doc = new PDFDocument({
        size: [297.64, 500 + orderItemsLength * 10],
        margins: {
            top: 10,
            bottom: 10,
            left: 10,
            right: 10,
        },
    });

    // logo
    if (logo) {
        // make the logo a readable buffer
        const response = await axios({
            method: "get",
            url: logo,
            responseType: "arraybuffer",
        });

        const logoBuffer = response.data;

        // Add an image, constrain it to a given size, and center it vertically and horizontally
        doc.image(logoBuffer, doc.page.width / 2 - 50 / 2, doc.y, {
            height: 40,
        });
    } else {
        doc.text(name, { align: "center" }).fontSize(25);
    }

    // address
    if (show_address) {
        doc.fontSize(10);
        doc.moveDown(0.2);
        doc.text(address, { align: "center" });
    }

    // phone number
    if (show_phone_number) {
        doc.fontSize(10);
        doc.moveDown(0.1);
        doc.text(`Phone: ${phone_number}`, { align: "center" });
    }

    // bin id and mushak
    if (binId && showMushak) {
        doc.fontSize(10);
        doc.moveDown(0.1);
        doc.text(`BIN: ${binId} | MUSHAK 6.3`, { align: "center" });
    } else if (binId && !showMushak) {
        doc.fontSize(10);
        doc.moveDown(0.1);
        doc.text(`BIN: ${binId}`, { align: "center" });
    }

    // website and email
    if (website && email) {
        doc.fontSize(10);
        doc.moveDown(0.1);
        doc.text(`${website} | ${email}`, { align: "center" });
    } else if (website && !email) {
        doc.fontSize(10);
        doc.moveDown(0.1);
        doc.text(`${website}`, { align: "center" });
    } else if (!website && email) {
        doc.fontSize(10);
        doc.moveDown(0.1);
        doc.text(`${email}`, { align: "center" });
    }

    // dashed line
    doc.moveTo(10, 116).lineTo(287.64, 116).dash(5, { space: 2 }).opacity(1).stroke();

    // note
    doc.moveDown(1);
    doc.fontSize(10);
    doc.text("Note:", { align: "left" });

    // table no
    if (show_table) {
        doc.fontSize(12);
        doc.moveDown(0.15);
        doc.text(`Table: ${table_no}`, { align: "left" });
    }

    // order id
    doc.fontSize(11);
    doc.moveDown(0.15);
    doc.text(`Order: ${order_id}`, { align: "left" });

    // dashed line for guest bill
    let xStart = 10;
    let xEnd = 287.64;
    let yPosition = show_table ? 170 : 155;
    let middlePoint = xStart + (xEnd - xStart) / 2;
    let textOffset = 1.5; // adjust this value to move the text up or down

    doc.moveTo(xStart, yPosition + textOffset)
        .lineTo(middlePoint - 30, yPosition + textOffset)
        .dash(5, { space: 2 })
        .opacity(1)
        .stroke();
    doc.text("Guest Bill", { align: "center" });
    doc.moveTo(middlePoint + 30, yPosition + textOffset)
        .lineTo(xEnd, yPosition + textOffset)
        .dash(5, { space: 2 })
        .opacity(1)
        .stroke();

    // cashier name
    if (showCashierName) {
        doc.fontSize(11);
        doc.moveDown(0.2);
        doc.text(`Cashier Name: ${cashierName}`, { align: "left" });
    }

    // date and time, extract from createdAt and show it space between
    const date = new Date(createdAt);
    const formattedDate = date.toLocaleDateString("en-US", {
        day: "numeric",
        month: "long",
        year: "numeric",
    });
    const formattedTime = date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
    });

    // date and time
    doc.fontSize(11);
    doc.moveDown(0.2);
    doc.text(`Date: ${formattedDate}`, { align: "left" });
    doc.fontSize(11);
    doc.moveUp(1);
    doc.text(`Time: ${formattedTime}`, { align: "right" });

    // show number of guests
    if (showNumberOfGuests) {
        doc.fontSize(11);
        doc.moveDown(0.2);
        doc.text(`Number of Guests: ${numberOfGuests}`, { align: "left" });
    }

    // dashed lined order items header
    let line_top = 0;
    let line_bottom = 0;
    if (showCashierName && showNumberOfGuests) {
        line_top = 230;
        line_bottom = 250;
    } else if (showCashierName && !showNumberOfGuests) {
        line_top = 215;
        line_bottom = 235;
    } else if (!showCashierName && showNumberOfGuests) {
        line_top = 215;
        line_bottom = 235;
    } else {
        line_top = 200;
        line_bottom = 220;
    }

    doc.moveTo(10, line_top).lineTo(287.64, line_top).dash(5, { space: 2 }).opacity(1).stroke();
    doc.moveDown(0.75);
    doc.text("Qty", { align: "left" });
    doc.moveUp(1);
    doc.text("Item Name", 55);
    doc.moveUp(1);
    doc.text("Price", 190);
    doc.moveUp(1);
    doc.text("Total Price", { align: "right" });
    doc.moveTo(10, line_bottom).lineTo(287.64, line_bottom).dash(5, { space: 2 }).opacity(1).stroke();

    // order items
    Array.from({ length: orderItemsLength }).forEach((_, index) => {
        doc.fontSize(10);
        doc.moveDown(0.75);
        doc.text(index + 1, 15);
        doc.moveUp(1);
        doc.text("Item Name", 55);
        doc.moveUp(1);
        doc.text("100", 190);
        doc.moveUp(1);
        doc.text(100 * (index + 1), { align: "right" });
    });

    // double dashed line
    const linePosition = line_top + 24 + orderItemsLength * 20;
    doc.moveTo(10, linePosition).lineTo(287.64, linePosition).dash(5, { space: 2 }).opacity(0.7).stroke();
    doc.moveTo(10, linePosition + 3)
        .lineTo(287.64, linePosition + 3)
        .dash(5, { space: 2 })
        .opacity(0.7)
        .stroke();

    // net total
    doc.fontSize(12);
    doc.moveDown(1);
    doc.text(`Net Total:`, 10);
    doc.fontSize(11);
    doc.moveUp(1);
    doc.text(`900`, { align: "right" });

    // double dashed line
    doc.moveTo(10, linePosition + 23)
        .lineTo(287.64, linePosition + 23)
        .dash(5, { space: 2 })
        .opacity(0.7)
        .stroke();
    doc.moveTo(10, linePosition + 26)
        .lineTo(287.64, linePosition + 26)
        .dash(5, { space: 2 })
        .opacity(0.7)
        .stroke();

    // include the VAT
    doc.fontSize(11);
    doc.moveDown(0.65);
    doc.text(`Included:`, { align: "left" });

    doc.fontSize(11);
    doc.moveDown(0.1);
    doc.text(`Service Charge-5.00%:`, { align: "left" });
    doc.fontSize(11);
    doc.moveUp(1);
    doc.text(`39.23`, { align: "right" });
    doc.fontSize(11);
    doc.moveDown(0.1);
    doc.text(`VAT-5.00%:`, { align: "left" });
    doc.fontSize(11);
    doc.moveUp(1);
    doc.text(`39.23`, { align: "right" });

    // double dashed line
    doc.moveTo(10, linePosition + 72)
        .lineTo(287.64, linePosition + 72)
        .dash(5, { space: 2 })
        .opacity(0.7)
        .stroke();
    doc.moveTo(10, linePosition + 75)
        .lineTo(287.64, linePosition + 75)
        .dash(5, { space: 2 })
        .opacity(0.7)
        .stroke();

    // gross total
    doc.fontSize(12);
    doc.moveDown(0.7);
    doc.text(`GROSS Total:`, 10);
    doc.fontSize(11);
    doc.moveUp(1);
    doc.text(`900`, { align: "right" });

    // double dashed line
    doc.moveTo(10, linePosition + 96)
        .lineTo(287.64, linePosition + 96)
        .dash(5, { space: 2 })
        .opacity(0.7)
        .stroke();
    doc.moveTo(10, linePosition + 96 + 3)
        .lineTo(287.64, linePosition + 96 + 3)
        .dash(5, { space: 2 })
        .opacity(0.7)
        .stroke();

    // barcode
    codes.loadModules(["code128"]);
    const x = codes.create("code128", "3278207ED6");
    doc.moveDown(0.75);
    doc.image(x, doc.page.width / 2 - 70, doc.y, {
        height: 40,
    });
    doc.moveDown(0.4);
    doc.text(`THANKS! VISIT AGAIN.`, { align: "center" });
    doc.text(`Powered By: BizSolution, bizsolution.io`, { align: "center" });

    // end doc and return it
    doc.end();

    return doc;
};

app.post("/print", async (req, res) => {
    // call generatePdf function
    const doc = await generatePdf({
        logo: "https://c9devstorage.blob.core.windows.net/c9-pos/c9-pos-f6d97551-0145-473e-8d0b-c92e7b264a45-jpeg",
        name: "Vapex Limited",
        show_address: true,
        address: "Bay's Park Heights, House 2, Road 9 Dhaka-1205, Bangladesh",
        show_phone_number: true,
        phone_number: "01711111111",
        binId: "001233812-1234",
        showMushak: true,
        website: "https://vapex.io",
        email: "contact@vapex.io",
        show_table: true,
        table_no: 1,
        order_id: "123456789",
        showCashierName: true,
        cashierName: "John Doe",
        createdAt: "2021-07-07T10:00:00.000Z",
        showNumberOfGuests: true,
        numberOfGuests: 4,
    });

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
