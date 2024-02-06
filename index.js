const PDFDocument = require("pdfkit");
const fs = require("fs");
const express = require("express");
const { default: axios } = require("axios");

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
    } = payload;

    // Create a document
    const doc = new PDFDocument({
        size: "A6",
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

    // dashed line
    let xStart = 10;
    let xEnd = 287.64;
    let yPosition = show_table ? 170 : 155;
    let middlePoint = xStart + (xEnd - xStart) / 2;
    let textOffset = 10; // adjust this value to move the text up or down

    if (show_table) {
        doc.moveTo(xStart, yPosition + textOffset).lineTo(middlePoint - 20, yPosition + textOffset).dash(5, { space: 2 }).opacity(1).stroke();
        doc.text('Your Text', middlePoint, yPosition, { width: 90, align: 'center' });
        doc.moveTo(middlePoint + 20, yPosition + textOffset).lineTo(xEnd, yPosition + textOffset).dash(5, { space: 2 }).opacity(1).stroke();
    } else {
        doc.moveTo(xStart, yPosition + textOffset).lineTo(middlePoint - 20, yPosition + textOffset).dash(5, { space: 2 }).opacity(1).stroke();
        doc.text('Your Text', middlePoint, yPosition, { width: 90, align: 'center' });
        doc.moveTo(middlePoint + 20, yPosition + textOffset).lineTo(xEnd, yPosition + textOffset).dash(5, { space: 2 }).opacity(1).stroke();
    }

    // end doc and return it
    doc.end();

    return doc;
};

app.get("/print", async (req, res) => {
    // call generatePdf function
    const doc = await generatePdf({
        logo: "https://c9devstorage.blob.core.windows.net/c9-pos/c9-pos-f6d97551-0145-473e-8d0b-c92e7b264a45-jpeg",
        name: "Vapex Limited",
        show_address: true,
        address: "Bay's Park Heights, House 2, Road 9 Dhaka-1205, Bangladesh",
        show_phone_number: true,
        phone_number: "01711111111",
        binId: "001233812-1234",
        showMushak: false,
        website: "https://vapex.io",
        email: "contact@vapex.io",
        show_table: false,
        table_no: 1,
        order_id: "123456789",
    });

    // See below for browser usage
    // doc.pipe(fs.createWriteStream("output.pdf"));
    doc.pipe(res);

    // return success
    // res.status(200).json({
    //     message: "success",

    // });
});

app.listen(8080, () => {
    console.log("Server started on port 8080");
});
