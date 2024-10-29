import { NextResponse } from "next/server";
import PDFParser from "pdf2json";
import { Document, Paragraph, TextRun, Packer } from "docx";

export async function POST(request) {
	try {
		const formData = await request.formData();
		const file = formData.get("file");

		if (!file) {
			return NextResponse.json({ error: "No file provided" }, { status: 400 });
		}

		try {
			// Convert file to buffer
			const buffer = Buffer.from(await file.arrayBuffer());
			console.log("Buffer created successfully", buffer.length);

			// Parse PDF
			const pdfData = await parsePDF(buffer);
			console.log("PDF parsed successfully", pdfData.Pages.length, "pages");

			// Convert to DOCX
			const docxBuffer = await convertToDocx(pdfData);
			console.log("DOCX created successfully", docxBuffer.length);

			// Return the converted file
			return new NextResponse(docxBuffer, {
				headers: {
					"Content-Type":
						"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
					"Content-Disposition": `attachment; filename="${file.name.replace(
						".pdf",
						".docx"
					)}"`,
				},
			});
		} catch (innerError) {
			console.error("Inner conversion error:", innerError);
			throw innerError;
		}
	} catch (error) {
		console.error("Conversion error details:", {
			message: error.message,
			stack: error.stack,
			name: error.name,
		});
		return NextResponse.json(
			{ error: "Error converting file: " + error.message },
			{ status: 500 }
		);
	}
}

function parsePDF(buffer) {
	return new Promise((resolve, reject) => {
		try {
			const pdfParser = new PDFParser(null, 1);

			pdfParser.on("pdfParser_dataReady", (pdfData) => {
				resolve(pdfData);
			});

			pdfParser.on("pdfParser_dataError", (error) => {
				console.error("PDF parsing error:", error);
				reject(error);
			});

			pdfParser.parseBuffer(buffer);
		} catch (error) {
			console.error("Error in parsePDF:", error);
			reject(error);
		}
	});
}

async function convertToDocx(pdfData) {
	try {
		const doc = new Document({
			sections: [
				{
					properties: {},
					children: [],
				},
			],
		});

		const DEFAULT_FONT_SIZE = 12 * 2; // 12pt = 24 half-points
		const paragraphs = [];

		pdfData.Pages.forEach((page, pageIndex) => {
			console.log(`Processing page ${pageIndex + 1}`);

			if (page.Texts && Array.isArray(page.Texts)) {
				const lineGroups = {};

				page.Texts.forEach((textItem) => {
					if (textItem.R && textItem.R[0] && textItem.R[0].T) {
						const yPos = Math.round(textItem.y * 100);

						if (!lineGroups[yPos]) {
							lineGroups[yPos] = {
								texts: [],
							};
						}

						lineGroups[yPos].texts.push({
							text: decodeURIComponent(textItem.R[0].T),
							x: textItem.x,
						});
					}
				});

				const sortedYPositions = Object.keys(lineGroups)
					.map(Number)
					.sort((a, b) => a - b);

				sortedYPositions.forEach((yPos) => {
					const lineGroup = lineGroups[yPos];
					const sortedTexts = lineGroup.texts
						.sort((a, b) => a.x - b.x)
						.map((t) => t.text);

					const lineText = sortedTexts.join(" ").trim();

					if (lineText) {
						const paragraph = new Paragraph({
							children: [
								new TextRun({
									text: lineText,
									size: DEFAULT_FONT_SIZE, // Using a consistent font size
								}),
							],
							spacing: {
								after: 200,
							},
						});

						paragraphs.push(paragraph);
					}
				});
			}

			if (pageIndex < pdfData.Pages.length - 1) {
				paragraphs.push(
					new Paragraph({
						pageBreakBefore: true,
					})
				);
			}
		});

		doc.addSection({
			properties: {},
			children: paragraphs,
		});

		const buffer = await Packer.toBuffer(doc);
		return buffer;
	} catch (error) {
		console.error("Error in convertToDocx:", error);
		throw error;
	}
}
