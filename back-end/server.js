const express = require('express');
const multer = require('multer');
const fs = require('fs');
const { Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun } = require('docx');
const csv = require('csv-parser');
const cors = require('cors');
const path = require('path');

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(cors());
app.use(express.json());

app.post('/convert', upload.single('csvFile'), (req, res) => {
    const filePath = req.file.path;
    const columnMapping = JSON.parse(req.body.columnMapping);
    const mergeColumns = JSON.parse(req.body.mergeColumns);
    const rows = [];
    fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', data => rows.push(data))
        .on('end', async () => {
    // Apply merge
    if (mergeColumns && mergeColumns.length === 3) {
    const [col1, col2, mergedCol] = mergeColumns;

    // Perform the merge
    rows.forEach(row => {
        row[mergedCol] = `${row[col1]} - ${row[col2]}`;
    });

    // 🔥 Add mergedCol to columnMapping if it's not already included
    if (!columnMapping[col1] && !columnMapping[col2] && !columnMapping[mergedCol]) {
        columnMapping[mergedCol] = mergedCol; // Default: use same name in Word
    }
}


    // Detect risk-related column (case insensitive)
    const severityKeys = Object.keys(columnMapping).filter(key =>
        key.toLowerCase().includes('risk') || key.toLowerCase().includes('severity')
    );

    if (severityKeys.length > 0) {
        const severityKey = severityKeys[0]; // Assuming first match
        const severityOrder = ['critical', 'high', 'medium', 'low'];

        // Filter out 'none' or 'NA'
        const filteredRows = rows.filter(row => {
            const val = (row[severityKey] || '').toLowerCase();
            return val && val !== 'none' && val !== 'na';
        });

        // Sort based on severity
        filteredRows.sort((a, b) => {
            const aVal = (a[severityKey] || '').toLowerCase();
            const bVal = (b[severityKey] || '').toLowerCase();
            return severityOrder.indexOf(aVal) - severityOrder.indexOf(bVal);
        });

        rows.length = 0;
        rows.push(...filteredRows); // Replace with filtered + sorted
    }

    // Insert serial number and build final rows
    const mappedKeys = Object.keys(columnMapping);
    const wordRows = rows.map((row, index) => {
        const cells = [];        
        cells.push(new TableCell({ children: [new Paragraph(String(index + 1))] }));
        mappedKeys.forEach(csvCol => {
            cells.push(new TableCell({ children: [new Paragraph(row[csvCol] || '')] }));
        });
        return new TableRow({ children: cells });
    });

    // Header row
    const headers = [
        new TableCell({ children: [new Paragraph('S.No')] }),
        ...mappedKeys.map(csvCol => new TableCell({ children: [new Paragraph(columnMapping[csvCol])] }))
    ];

    const doc = new Document({
        sections: [{
            children: [
                new Paragraph({ text: "CSV Data Table", heading: "Heading1" }),
                new Table({ rows: [new TableRow({ children: headers }), ...wordRows] })
            ]
        }]
    });

    const buffer = await Packer.toBuffer(doc);
    const outputPath = path.join(__dirname, 'uploads', `${Date.now()}_output.docx`);
    fs.writeFileSync(outputPath, buffer);

    res.download(outputPath, 'Converted.docx', () => {
        fs.unlinkSync(filePath);
        fs.unlinkSync(outputPath);
    });
});

        // .on('end', async () => {
        //     // Apply merge
        //     if (mergeColumns && mergeColumns.length === 3) {
        //         // console.log("req recieved 3", mergeColumns, " & ");
        //         const [col1, col2, mergedCol] = mergeColumns;
        //         rows.forEach(row => {
        //             row[mergedCol] = `${row[col1]} - ${row[col2]}`;
        //             // console.log("row is ", row);
        //         });

        //     }
        //     // Insert serial number and build final rows
        //     const mappedKeys = Object.keys(columnMapping);
        //     const wordRows = rows.map((row, index) => {
        //         const cells = [];
        //         cells.push(new TableCell({ children: [new Paragraph(String(index + 1))] }));
        //         mappedKeys.forEach(csvCol => {
        //             cells.push(new TableCell({ children: [new Paragraph(row[csvCol] || '')] }));
        //         });
        //         return new TableRow({ children: cells });
        //     });

        //     for(var i=0;i<3;i++){
        //         console.log(wordRows[i]);
        //     }
        //     const headers = [
        //         new TableCell({ children: [new Paragraph('S.No')] }),
        //         ...mappedKeys.map(csvCol => new TableCell({ children: [new Paragraph(columnMapping[csvCol])] }))
        //     ];

        //     const doc = new Document({
        //         sections: [{
        //             children: [
        //                 new Paragraph({ text: "CSV Data Table", heading: "Heading1" }),
        //                 new Table({ rows: [new TableRow({ children: headers }), ...wordRows] })
        //             ]
        //         }]
        //     });

        //     const buffer = await Packer.toBuffer(doc);
        //     const outputPath = path.join(__dirname, 'uploads', `${Date.now()}_output.docx`);
        //     fs.writeFileSync(outputPath, buffer);

        //     res.download(outputPath, 'Converted.docx', () => {
        //         fs.unlinkSync(filePath);
        //         fs.unlinkSync(outputPath);
        //     });
        // });
});

app.listen(5000, () => console.log('Node-only server running on port 5000'));
