package com.expensetracker.ocr;

import net.sourceforge.tess4j.Tesseract;
import net.sourceforge.tess4j.TesseractException;
import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.IOException;
import java.nio.file.Path;

@Service
public class TesseractOcrEngine {

    private final Tesseract tesseract;

    public TesseractOcrEngine() {
        tesseract = new Tesseract();
        tesseract.setDatapath("/usr/share/tesseract-ocr/4.00/tessdata");
        tesseract.setLanguage("eng");
        tesseract.setPageSegMode(6);
    }

    public String extractText(Path imagePath) {
        try {
            BufferedImage image = ImageIO.read(imagePath.toFile());
            return tesseract.doOCR(image);
        } catch (TesseractException | IOException e) {
            throw new RuntimeException("OCR processing failed", e);
        }
    }
}
