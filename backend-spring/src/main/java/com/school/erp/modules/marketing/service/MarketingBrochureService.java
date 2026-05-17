package com.school.erp.modules.marketing.service;

import com.lowagie.text.Document;
import com.lowagie.text.Element;
import com.lowagie.text.FontFactory;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.Rectangle;
import com.lowagie.text.pdf.ColumnText;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfContentByte;
import com.lowagie.text.pdf.PdfPageEventHelper;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import com.school.erp.modules.marketing.dto.MarketingDTOs;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class MarketingBrochureService {
    private static final String BROCHURE_VERSION = "v1.0";
    private static final Color BRAND_PRIMARY = new Color(27, 58, 48);
    private static final Color BRAND_ACCENT = new Color(192, 92, 61);
    private static final Color TEXT_MUTED = new Color(87, 83, 78);
    private static final Color SURFACE_SOFT = new Color(247, 248, 250);
    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd MMM yyyy");

    public byte[] generate(List<MarketingDTOs.FeatureResponse> features) {
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4, 40, 40, 40, 40);
            PdfWriter writer = PdfWriter.getInstance(document, out);
            writer.setPageEvent(new BrochurePageFooterEvent());
            document.open();

            var title = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 26, BRAND_PRIMARY);
            var sectionTitle = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14, BRAND_PRIMARY);
            var body = FontFactory.getFont(FontFactory.HELVETICA, 11, Color.DARK_GRAY);
            var muted = FontFactory.getFont(FontFactory.HELVETICA, 10, TEXT_MUTED);
            var whiteBold = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, Color.WHITE);
            var accentSubtitle = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 16, BRAND_ACCENT);

            addBrandBanner(document);

            document.add(new Paragraph("EduPortal SaaS ERP", title));
            document.add(new Paragraph("Unified School Operations Platform", accentSubtitle));
            document.add(new Paragraph(" "));
            document.add(new Paragraph(
                    "Built for school owners, principals, and operations teams to run academics, finance, communication, and administration from one secure platform.",
                    body
            ));
            document.add(new Paragraph(" "));

            PdfPTable outcomes = new PdfPTable(3);
            outcomes.setWidthPercentage(100);
            outcomes.setSpacingBefore(8);
            outcomes.setSpacingAfter(14);
            outcomes.setWidths(new float[]{1f, 1f, 1f});
            addBadgeCell(outcomes, "Faster Decision Making", whiteBold);
            addBadgeCell(outcomes, "Higher Parent Trust", whiteBold);
            addBadgeCell(outcomes, "Operational Standardization", whiteBold);
            document.add(outcomes);

            document.add(new Paragraph("What School Leaders Get", sectionTitle));
            document.add(new Paragraph("• Executive visibility across academics, fees, attendance, and operations", body));
            document.add(new Paragraph("• Role-based workflows for teachers, coordinators, office staff, and management", body));
            document.add(new Paragraph("• Tenant-safe, academic-year aware architecture with audit-ready controls", body));
            document.add(new Paragraph("• Configuration-first module design ready for future scale and extensions", body));
            document.add(new Paragraph(" "));

            document.add(new Paragraph("Module Catalog", sectionTitle));
            PdfPTable featureTable = new PdfPTable(3);
            featureTable.setWidthPercentage(100);
            featureTable.setWidths(new float[]{2.1f, 1.2f, 3.5f});
            featureTable.setSpacingBefore(8);
            featureTable.setSpacingAfter(14);
            addHeaderCell(featureTable, "Module");
            addHeaderCell(featureTable, "Category");
            addHeaderCell(featureTable, "Business Value");
            for (MarketingDTOs.FeatureResponse feature : features) {
                addBodyCell(featureTable, feature.name(), body);
                addBodyCell(featureTable, feature.category(), body);
                addBodyCell(featureTable, feature.shortDescription(), body);
            }
            document.add(featureTable);

            document.add(new Paragraph("Implementation Approach", sectionTitle));
            document.add(new Paragraph("1) Discovery and process mapping", body));
            document.add(new Paragraph("2) Controlled rollout by module and stakeholder group", body));
            document.add(new Paragraph("3) Data migration, onboarding, and live support", body));
            document.add(new Paragraph("4) Continuous optimization using usage insights", body));
            document.add(new Paragraph(" "));

            document.add(new Paragraph("Contact and Next Steps", sectionTitle));
            document.add(new Paragraph("• Request a guided product walkthrough", body));
            document.add(new Paragraph("• Share school size and current systems for rollout planning", body));
            document.add(new Paragraph("• Get a phased adoption recommendation for your institution", body));
            document.add(new Paragraph(" "));
            document.add(new Paragraph(
                    "Brochure generated from live product catalog (" + features.size() + " modules): "
                            + features.stream().map(MarketingDTOs.FeatureResponse::name).collect(Collectors.joining(", ")),
                    muted
            ));

            document.close();
            return out.toByteArray();
        } catch (Exception e) {
            throw new IllegalStateException("Failed to generate brochure PDF", e);
        }
    }

    private void addBrandBanner(Document document) throws Exception {
        PdfPTable brandHeader = new PdfPTable(3);
        brandHeader.setWidthPercentage(100);
        brandHeader.setWidths(new float[]{1f, 4f, 2.4f});
        brandHeader.setSpacingAfter(16f);

        PdfPCell logoBadge = new PdfPCell(new Phrase("SV", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14, Color.WHITE)));
        logoBadge.setHorizontalAlignment(Element.ALIGN_CENTER);
        logoBadge.setVerticalAlignment(Element.ALIGN_MIDDLE);
        logoBadge.setFixedHeight(28f);
        logoBadge.setBackgroundColor(BRAND_PRIMARY);
        logoBadge.setBorder(Rectangle.NO_BORDER);
        brandHeader.addCell(logoBadge);

        PdfPCell brandText = new PdfPCell(new Phrase("SchoolVault | EduPortal", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, BRAND_PRIMARY)));
        brandText.setVerticalAlignment(Element.ALIGN_MIDDLE);
        brandText.setPaddingLeft(8f);
        brandText.setBorder(Rectangle.NO_BORDER);
        brandHeader.addCell(brandText);

        PdfPCell metaText = new PdfPCell(new Phrase(
                "Confidential | " + BROCHURE_VERSION + " | " + DATE_FMT.format(LocalDate.now()),
                FontFactory.getFont(FontFactory.HELVETICA, 9, TEXT_MUTED)
        ));
        metaText.setHorizontalAlignment(Element.ALIGN_RIGHT);
        metaText.setVerticalAlignment(Element.ALIGN_MIDDLE);
        metaText.setBorder(Rectangle.NO_BORDER);
        brandHeader.addCell(metaText);

        document.add(brandHeader);

        PdfPTable accentStripe = new PdfPTable(1);
        accentStripe.setWidthPercentage(100);
        accentStripe.setSpacingAfter(18f);
        PdfPCell stripe = new PdfPCell(new Phrase(""));
        stripe.setFixedHeight(6f);
        stripe.setBackgroundColor(BRAND_ACCENT);
        stripe.setBorder(Rectangle.NO_BORDER);
        accentStripe.addCell(stripe);
        document.add(accentStripe);
    }

    private void addBadgeCell(PdfPTable table, String value, com.lowagie.text.Font font) {
        PdfPCell cell = new PdfPCell(new Phrase(value, font));
        cell.setHorizontalAlignment(Element.ALIGN_CENTER);
        cell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        cell.setPadding(10f);
        cell.setBackgroundColor(BRAND_PRIMARY);
        cell.setBorderColor(BRAND_PRIMARY);
        table.addCell(cell);
    }

    private void addHeaderCell(PdfPTable table, String value) {
        PdfPCell cell = new PdfPCell(new Phrase(value, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, Color.WHITE)));
        cell.setHorizontalAlignment(Element.ALIGN_LEFT);
        cell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        cell.setPadding(8f);
        cell.setBackgroundColor(BRAND_PRIMARY);
        cell.setBorderColor(BRAND_PRIMARY);
        table.addCell(cell);
    }

    private void addBodyCell(PdfPTable table, String value, com.lowagie.text.Font font) {
        PdfPCell cell = new PdfPCell(new Phrase(value == null ? "" : value, font));
        cell.setHorizontalAlignment(Element.ALIGN_LEFT);
        cell.setVerticalAlignment(Element.ALIGN_TOP);
        cell.setPadding(7f);
        cell.setBackgroundColor(SURFACE_SOFT);
        cell.setBorderColor(new Color(223, 227, 232));
        table.addCell(cell);
    }

    private static class BrochurePageFooterEvent extends PdfPageEventHelper {
        @Override
        public void onEndPage(PdfWriter writer, Document document) {
            PdfContentByte cb = writer.getDirectContent();
            cb.saveState();
            try {
                cb.setColorStroke(new Color(214, 220, 228));
                cb.setLineWidth(0.8f);
                cb.moveTo(document.left(), document.bottom() - 6f);
                cb.lineTo(document.right(), document.bottom() - 6f);
                cb.stroke();

                ColumnText.showTextAligned(
                        cb,
                        Element.ALIGN_LEFT,
                        new Phrase("Confidential — For institutional evaluation only",
                                FontFactory.getFont(FontFactory.HELVETICA, 8, TEXT_MUTED)),
                        document.left(),
                        document.bottom() - 18f,
                        0
                );
                ColumnText.showTextAligned(
                        cb,
                        Element.ALIGN_RIGHT,
                        new Phrase("Page " + writer.getPageNumber() + " | " + BROCHURE_VERSION + " | " + DATE_FMT.format(LocalDate.now()),
                                FontFactory.getFont(FontFactory.HELVETICA, 8, TEXT_MUTED)),
                        document.right(),
                        document.bottom() - 18f,
                        0
                );
            } finally {
                cb.restoreState();
            }
        }
    }
}
