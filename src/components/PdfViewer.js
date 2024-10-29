import React, { useEffect, useRef, useState } from 'react';
import { Document, Page, Text, StyleSheet, pdf } from '@react-pdf/renderer';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@4.7.76/build/pdf.worker.min.mjs`;

const styles = StyleSheet.create({
  body: {
    paddingTop: 35,
    paddingBottom: 65,
    paddingHorizontal: 35,
  },
  title: {
    fontSize: 24,
    textAlign: 'center',
  },
  author: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 40,
  },
  subtitle: {
    fontSize: 18,
    margin: 12,
  },
  text: {
    margin: 12,
    fontSize: 14,
    textAlign: 'justify',
    fontFamily: 'Times-Roman',
  },
  image: {
    marginVertical: 15,
    marginHorizontal: 100,
  },
  header: {
    fontSize: 12,
    marginBottom: 20,
    textAlign: 'center',
    color: 'grey',
  },
  pageNumber: {
    position: 'absolute',
    fontSize: 12,
    bottom: 30,
    left: 0,
    right: 0,
    textAlign: 'center',
    color: 'grey',
  },
});

// Define the PDF document structure
const MyDocument = ({content}) => (
  <Document>
    <Page style={styles.body}>
      <Text style={styles.header} fixed>
        ~ Created with react-pdf ~
      </Text>
      <Text style={styles.text}>
        {content}
      </Text>
      <Text
        style={styles.pageNumber}
        render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
        fixed
      />
    </Page>
  </Document>
);

const PdfViewer = ({content, renderContent, setRenderContent}) => {
  const canvasRef = useRef(null);
  const [pdfData, setPdfData] = useState(null);
  const [pageCount, setPageCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isRendering, setIsRendering] = useState(false);

  useEffect(() => {
    const generatePdfBlob = async () => {
      const pdfBlob = await pdf(<MyDocument content={content} />).toBlob();
      const pdfURL = URL.createObjectURL(pdfBlob);
      const loadedPdf = await pdfjsLib.getDocument(pdfURL).promise;
      setPdfData(loadedPdf);
      setPageCount(loadedPdf.numPages);
      setRenderContent(false);
    };

    if (renderContent) {
      generatePdfBlob();
    }
  }, [renderContent, content]);

  const renderPage = async (pageNum) => {
    if (!pdfData || isRendering) return;
    setIsRendering(true);

    const page = await pdfData.getPage(pageNum);
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    const viewport = page.getViewport({ scale: 1 });
    canvas.width = viewport.width;
    canvas.height = viewport.height + 20; // Extra space for the page number

    await page.render({ canvasContext: context, viewport }).promise;

    // Draw the page number at the bottom center
    setIsRendering(false);
  };

  useEffect(() => {
    if (pdfData) {
      renderPage(currentPage);
    }
  }, [currentPage, pdfData]);

  const goToPreviousPage = () =>
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  const goToNextPage = () =>
    setCurrentPage((prev) => Math.min(prev + 1, pageCount));

  return (
    <div style={{ textAlign: 'center' }}>
      <canvas
        ref={canvasRef}
        style={{ border: '1px solid #ccc' }}
      />
      <div style={{ marginTop: '10px' }}>
        <button
          onClick={goToPreviousPage}
          disabled={currentPage === 1}
        >
          Previous
        </button>
        <span style={{ margin: '0 10px' }}>
          {currentPage} / {pageCount}
        </span>
        <button
          onClick={goToNextPage}
          disabled={currentPage === pageCount}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default PdfViewer;
