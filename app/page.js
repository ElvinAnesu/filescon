"use client";

import { useState } from "react";
import FileUpload from "@/components/FileUpload";
import ConversionStatus from "@/components/ConversionStatus";

export default function Home() {
	const [file, setFile] = useState(null);
	const [converting, setConverting] = useState(false);
	const [error, setError] = useState(null);

	return (
		<main className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
			<div className="max-w-3xl mx-auto">
				<div className="text-center">
					<h1 className="text-4xl font-bold text-gray-900 mb-8">
						PDF to Word Converter
					</h1>
					<p className="text-lg text-gray-600 mb-8">
						Convert your PDF documents to Word format in seconds
					</p>
				</div>

				<FileUpload
					file={file}
					setFile={setFile}
					converting={converting}
					setConverting={setConverting}
					setError={setError}
				/>

				{error && <div className="mt-4 text-red-600 text-center">{error}</div>}

				{converting && <ConversionStatus />}
			</div>
		</main>
	);
}
