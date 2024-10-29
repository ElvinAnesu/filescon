"use client";

import { useState } from "react";

export default function FileUpload({
	file,
	setFile,
	converting,
	setConverting,
	setError,
}) {
	const [dragActive, setDragActive] = useState(false);

	const handleDrag = (e) => {
		e.preventDefault();
		e.stopPropagation();
		if (e.type === "dragenter" || e.type === "dragover") {
			setDragActive(true);
		} else if (e.type === "dragleave") {
			setDragActive(false);
		}
	};

	const handleDrop = async (e) => {
		e.preventDefault();
		e.stopPropagation();
		setDragActive(false);

		const files = e.dataTransfer.files;
		handleFile(files[0]);
	};

	const handleChange = (e) => {
		e.preventDefault();
		handleFile(e.target.files[0]);
	};

	const handleFile = (file) => {
		if (file?.type !== "application/pdf") {
			setError("Please upload a PDF file");
			return;
		}
		setFile(file);
		setError(null);
	};

	const handleConversion = async () => {
		if (!file) return;

		setConverting(true);
		setError(null);

		try {
			const formData = new FormData();
			formData.append("file", file);

			const response = await fetch("/api/convert", {
				method: "POST",
				body: formData,
			});

			const contentType = response.headers.get("content-type");

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Conversion failed");
			}

			if (contentType && contentType.includes("application/json")) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Conversion failed");
			}

			// Get the blob from the response
			const blob = await response.blob();

			// Create download link
			const url = window.URL.createObjectURL(blob);
			const link = document.createElement("a");
			link.href = url;
			link.download = file.name.replace(".pdf", ".docx");
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			window.URL.revokeObjectURL(url);
		} catch (error) {
			setError(`Error converting file: ${error.message}`);
			console.error("Conversion error:", error);
		} finally {
			setConverting(false);
		}
	};

	return (
		<div className="max-w-xl mx-auto">
			<div
				className={`border-2 border-dashed rounded-lg p-8 text-center
          ${dragActive ? "border-blue-500 bg-blue-50" : "border-gray-300"}
          ${file ? "bg-green-50" : ""}`}
				onDragEnter={handleDrag}
				onDragLeave={handleDrag}
				onDragOver={handleDrag}
				onDrop={handleDrop}
			>
				{!file ? (
					<>
						<input
							type="file"
							accept=".pdf"
							onChange={handleChange}
							className="hidden"
							id="file-upload"
						/>
						<label
							htmlFor="file-upload"
							className="cursor-pointer text-blue-600 hover:text-blue-800"
						>
							<span className="block text-gray-700 mb-2">
								Drag and drop your PDF here, or click to select
							</span>
							<span className="text-sm">Supported format: PDF</span>
						</label>
					</>
				) : (
					<div>
						<p className="text-green-600 mb-4">✓ {file.name}</p>
						<button
							onClick={() => setFile(null)}
							className="text-red-600 hover:text-red-800 text-sm"
						>
							Remove file
						</button>
					</div>
				)}
			</div>

			{file && !converting && (
				<button
					onClick={handleConversion}
					className="w-full mt-4 bg-blue-600 text-white py-2 px-4 rounded-md
            hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
				>
					Convert to Word
				</button>
			)}
		</div>
	);
}
