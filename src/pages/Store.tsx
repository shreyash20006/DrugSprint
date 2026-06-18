import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Search, ShoppingBag, X } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { ScienceBackground } from '../components/ScienceBackground';


interface StudyBook {
  id: string;
  title: string;
  subject: string;
  price: string;
  year: string;
  image: string;
  rating: string;
  pages: number;
  checkoutUrl: string;
  descriptionHtml?: string;
}

export const Store: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedBook, setSelectedBook] = useState<StudyBook | null>(null);

      const studyBooks: StudyBook[] = [
    {
      id: '1',
      title: `Human Anatomy & Physiology II Handwritten Notes | B.Pharm 1st Year 2nd Semester | TGPCOP NOTES`,
      subject: `Anatomy PDF`,
      price: '₹149',
      year: 'First Year',
      image: 'https://cdn.shopify.com/s/files/1/1000/3998/3418/files/WhatsAppImage2026-05-14at6.55.57PM.jpg?v=1778765210',
      rating: '4.8',
      pages: 150,
      checkoutUrl: 'https://tgpcop-pharma.myshopify.com/products/human-anatomy-physiology-ii-b-pharm-sem-2-tgpcop',
      descriptionHtml: "<p>TGPCOP NOTES presents premium handwritten Human Anatomy &amp; Physiology II notes specially designed for B.Pharm 1st Year 2nd Semester students.</p>\n<p>These notes are prepared in an easy-to-understand format with colorful diagrams, flowcharts, important university questions, and quick revision points to help students score better in exams.</p>\n<p>What You Will Get:</p>\n<p>Detailed handwritten notes</p>\n<p>Important diagrams &amp; labeled figures</p>\n<p>Exam-oriented content</p>\n<p>PYQs &amp; viva questions</p>\n<p>Quick revision format</p>\n<p>Easy language for fast learning</p>\n<p>Mobile &amp; PDF friendly notes</p>\n<p>Format:</p>\n<p>Digital PDF Download</p>\n<p>Instant Access After Purchase</p>\n<p><br>Prepared By: TGPCOP NOTES — Learn • Grow • Succeed<br></p>",
    },
    {
      id: '2',
      title: `Pharmaceutical Marketing Management (B.Pharm 8th Sem)`,
      subject: `Management`,
      price: '₹49',
      year: 'Fourth Year',
      image: 'https://cdn.shopify.com/s/files/1/1000/3998/3418/files/rn-image_picker_lib_temp_cdfe768a-a5b9-4009-bccc-b108f011e7dd.png?v=1779039248',
      rating: '4.8',
      pages: 150,
      checkoutUrl: 'https://tgpcop-pharma.myshopify.com/products/pharmaceutical-marketing-management-b-pharm-sem-8',
      descriptionHtml: "<p><strong>Premium handwritten Pharmaceutical Marketing Management notes covering pharmaceutical sales, marketing strategies, product management and healthcare marketing concepts.</strong></p>\n<ul>\n<li>✅ Pharmaceutical Sales – detailing, territory management</li>\n<li>✅ Marketing Strategies – segmentation, targeting &amp; positioning</li>\n<li>✅ Product Management – product life cycle &amp; brand management</li>\n<li>✅ Healthcare Marketing – hospital &amp; OTC marketing</li>\n<li>✅ Pricing &amp; Distribution in Pharma sector</li>\n<li>✅ Regulatory aspects of Pharma Advertising</li>\n<li>✅ Unit-wise Important Questions</li>\n<li>✅ Instant PDF Download</li>\n</ul>\n<p> </p>\n<p>📄 PDF Ebook Variant<br>• Instant Download<br>• Lifetime Access</p>\n<p>🖨️ Black &amp; White Printed Notes<br>• Printed Notes + FREE PDF<br>• Spiral Bound<br>• Delivery Across India</p>\n<p>🌈 Premium Color Printed Notes<br>• Premium Color Printing + FREE PDF<br>• Spiral Bound<br>• Delivery Across India</p>\n<p>🎁 Every Printed Notes Order Includes Complimentary PDF Access.</p>",
    },
    {
      id: '3',
      title: `Social & Preventive Pharmacy (B.Pharm 8th Sem)`,
      subject: `Preventive Pharmacy`,
      price: '₹49',
      year: 'Fourth Year',
      image: 'https://cdn.shopify.com/s/files/1/1000/3998/3418/files/rn-image_picker_lib_temp_45cde050-16af-4f5b-9c58-9aef9bc70cdd.png?v=1779039055',
      rating: '4.8',
      pages: 150,
      checkoutUrl: 'https://tgpcop-pharma.myshopify.com/products/social-preventive-pharmacy-b-pharm-sem-8',
      descriptionHtml: "<p><strong>Comprehensive handwritten Social &amp; Preventive Pharmacy notes including public health, epidemiology, national health programs and preventive healthcare concepts.</strong></p><ul>\n<li>✅ Public Health – concepts, determinants &amp; indicators</li>\n<li>✅ Epidemiology – disease patterns, incidence &amp; prevalence</li>\n<li>✅ National Health Programs – NHM, immunization &amp; TB control</li>\n<li>✅ Preventive Healthcare – primary, secondary &amp; tertiary</li>\n<li>✅ Health Education &amp; Communication</li>\n<li>✅ Healthcare System in India – structure &amp; functions</li>\n<li>✅ Unit-wise Important Questions</li>\n<li>✅ Instant PDF Download</li>\n</ul><p><em>Format: PDF Ebook | Digital Download | No physical product will be shipped.</em></p>",
    },
    {
      id: '4',
      title: `Biostatistics & Research Methodology (B.Pharm 8th Sem)`,
      subject: `Biostatistics`,
      price: '₹49',
      year: 'Fourth Year',
      image: 'https://cdn.shopify.com/s/files/1/1000/3998/3418/files/WhatsAppImage2026-05-17at5.38.23PM.jpg?v=1779019728',
      rating: '4.8',
      pages: 150,
      checkoutUrl: 'https://tgpcop-pharma.myshopify.com/products/biostatistics-research-methodology-b-pharm-sem-8',
      descriptionHtml: "<p><strong>Easy handwritten Biostatistics &amp; Research Methodology notes covering sampling, probability, hypothesis testing and pharmaceutical research concepts in simple language.</strong></p><ul>\n<li>✅ Sampling – types, methods &amp; sample size calculation</li>\n<li>✅ Probability – distributions, normal &amp; binomial</li>\n<li>✅ Hypothesis Testing – t-test, chi-square, ANOVA</li>\n<li>✅ Pharmaceutical Research Design – clinical trials &amp; study types</li>\n<li>✅ Data Presentation – graphs, tables &amp; statistical software</li>\n<li>✅ GPAT &amp; University Exam focused</li>\n<li>✅ Unit-wise Important Questions</li>\n<li>✅ Instant PDF Download</li>\n</ul><p><em>Format: PDF Ebook | Digital Download | No physical product will be shipped.</em></p>",
    },
    {
      id: '5',
      title: `Novel Drug Delivery System (B.Pharm 7th Sem)`,
      subject: `Nanotechnology`,
      price: '₹49',
      year: 'Fourth Year',
      image: 'https://cdn.shopify.com/s/files/1/1000/3998/3418/files/WhatsAppImage2026-05-17at5.43.20PM.jpg?v=1779020026',
      rating: '4.8',
      pages: 150,
      checkoutUrl: 'https://tgpcop-pharma.myshopify.com/products/novel-drug-delivery-system-b-pharm-sem-7',
      descriptionHtml: "<p><strong>Premium handwritten NDDS notes including liposomes, nanoparticles, transdermal systems and advanced drug delivery technologies with exam-oriented explanations.</strong></p><ul>\n<li>✅ Liposomes – preparation, types &amp; pharmaceutical uses</li>\n<li>✅ Nanoparticles – polymeric, solid lipid &amp; dendrimers</li>\n<li>✅ Transdermal Drug Delivery – patches &amp; penetration enhancers</li>\n<li>✅ Controlled Release Systems – matrix &amp; reservoir types</li>\n<li>✅ Targeted Drug Delivery – passive &amp; active targeting</li>\n<li>✅ GPAT &amp; University Exam focused</li>\n<li>✅ Unit-wise Important Questions</li>\n<li>✅ Instant PDF Download</li>\n</ul><p><em>Format: PDF Ebook | Digital Download | No physical product will be shipped.</em></p>",
    },
    {
      id: '6',
      title: `Pharmacy Practice (B.Pharm 7th Sem)`,
      subject: `Clinical Pharmacy`,
      price: '₹49',
      year: 'Fourth Year',
      image: 'https://cdn.shopify.com/s/files/1/1000/3998/3418/files/WhatsAppImage2026-05-17at5.48.25PM.jpg?v=1779020328',
      rating: '4.8',
      pages: 150,
      checkoutUrl: 'https://tgpcop-pharma.myshopify.com/products/pharmacy-practice-b-pharm-sem-7',
      descriptionHtml: "<p><strong>Complete handwritten Pharmacy Practice notes covering clinical pharmacy, patient counseling, hospital pharmacy and prescription handling in simplified format.</strong></p><ul>\n<li>✅ Clinical Pharmacy – drug therapy monitoring &amp; rational use</li>\n<li>✅ Patient Counseling – communication skills &amp; medication advice</li>\n<li>✅ Hospital Pharmacy – dispensing, procurement &amp; store management</li>\n<li>✅ Prescription Handling – reading, checking &amp; dispensing</li>\n<li>✅ Drug Information Services &amp; Medication errors</li>\n<li>✅ Pharmacoeconomics – basics &amp; health outcome</li>\n<li>✅ Unit-wise Important Questions</li>\n<li>✅ Instant PDF Download</li>\n</ul><p><em>Format: PDF Ebook | Digital Download | No physical product will be shipped.</em></p>",
    },
    {
      id: '7',
      title: `Industrial Pharmacy II (B.Pharm 7th Sem)`,
      subject: `Industrial Pharmacy`,
      price: '₹49',
      year: 'Fourth Year',
      image: 'https://cdn.shopify.com/s/files/1/1000/3998/3418/files/WhatsAppImage2026-05-17at5.52.17PM.jpg?v=1779020565',
      rating: '4.8',
      pages: 150,
      checkoutUrl: 'https://tgpcop-pharma.myshopify.com/products/industrial-pharmacy-ii-b-pharm-sem-7',
      descriptionHtml: "<p><strong>Detailed handwritten Industrial Pharmacy II notes including scale-up techniques, technology transfer, validation and pharmaceutical production concepts for exams and viva preparation.</strong></p><ul>\n<li>✅ Scale-up Techniques – pilot to commercial scale</li>\n<li>✅ Technology Transfer – process &amp; documentation</li>\n<li>✅ Validation – equipment, process &amp; cleaning</li>\n<li>✅ Regulatory Affairs – FDA, WHO &amp; ICH guidelines</li>\n<li>✅ Pharmaceutical Production &amp; Plant design</li>\n<li>✅ GPAT &amp; University Exam focused</li>\n<li>✅ Unit-wise Important Questions</li>\n<li>✅ Instant PDF Download</li>\n</ul><p><em>Format: PDF Ebook | Digital Download | No physical product will be shipped.</em></p>",
    },
    {
      id: '8',
      title: `Instrumental Methods of Analysis (B.Pharm 7th Sem)`,
      subject: `Chromatography`,
      price: '₹49',
      year: 'Fourth Year',
      image: 'https://cdn.shopify.com/s/files/1/1000/3998/3418/files/WhatsAppImage2026-05-17at5.56.40PM.jpg?v=1779020823',
      rating: '4.8',
      pages: 150,
      checkoutUrl: 'https://tgpcop-pharma.myshopify.com/products/instrumental-methods-analysis-b-pharm-sem-7',
      descriptionHtml: "<p><strong>Premium handwritten Instrumental Methods of Analysis notes covering spectroscopy, chromatography and analytical techniques with simplified explanations and diagrams.</strong></p><ul>\n<li>✅ Spectroscopy – UV-Visible, IR, NMR &amp; Mass Spectrometry</li>\n<li>✅ Chromatography – TLC, HPLC, GC &amp; column chromatography</li>\n<li>✅ Analytical Techniques – flame photometry, AAS &amp; more</li>\n<li>✅ Instrumentation principles &amp; working diagrams</li>\n<li>✅ Pharmaceutical analysis applications</li>\n<li>✅ GPAT &amp; University Exam focused</li>\n<li>✅ Unit-wise Important Questions</li>\n<li>✅ Instant PDF Download</li>\n</ul><p><em>Format: PDF Ebook | Digital Download | No physical product will be shipped.</em></p>",
    },
    {
      id: '9',
      title: `Quality Assurance (B.Pharm 6th Sem)`,
      subject: `GMP`,
      price: '₹49',
      year: 'Third Year',
      image: 'https://cdn.shopify.com/s/files/1/1000/3998/3418/files/WhatsAppImage2026-05-17at5.57.54PM.jpg?v=1779020892',
      rating: '4.8',
      pages: 150,
      checkoutUrl: 'https://tgpcop-pharma.myshopify.com/products/quality-assurance-b-pharm-sem-6',
      descriptionHtml: "<p><strong>Complete handwritten Quality Assurance notes covering GMP, validation, QA systems, SOPs and pharmaceutical quality control concepts in easy language.</strong></p><ul>\n<li>✅ GMP – Good Manufacturing Practices (Schedule M)</li>\n<li>✅ Validation – process, cleaning, equipment &amp; analytical</li>\n<li>✅ QA Systems – ISO, ICH guidelines overview</li>\n<li>✅ SOPs – writing, implementation &amp; review</li>\n<li>✅ Quality Control – in-process &amp; finished product testing</li>\n<li>✅ Pharmaceutical Documentation &amp; Audits</li>\n<li>✅ GPAT &amp; University Exam focused</li>\n<li>✅ Unit-wise Important Questions</li>\n<li>✅ Instant PDF Download</li>\n</ul><p><em>Format: PDF Ebook | Digital Download | No physical product will be shipped.</em></p>",
    },
    {
      id: '10',
      title: `Biopharmaceutics & Pharmacokinetics (B.Pharm 6th Sem)`,
      subject: `Biopharmaceutics`,
      price: '₹49',
      year: 'Third Year',
      image: 'https://cdn.shopify.com/s/files/1/1000/3998/3418/files/WhatsAppImage2026-05-17at10.35.57PM.jpg?v=1779037603',
      rating: '4.8',
      pages: 150,
      checkoutUrl: 'https://tgpcop-pharma.myshopify.com/products/biopharmaceutics-pharmacokinetics-b-pharm-sem-6',
      descriptionHtml: "<p><strong>Detailed handwritten Biopharmaceutics &amp; Pharmacokinetics notes including ADME, compartment models, bioavailability and pharmacokinetic calculations with simplified diagrams.</strong></p><ul>\n<li>✅ ADME – absorption, distribution, metabolism &amp; excretion</li>\n<li>✅ One &amp; Two Compartment Models – equations &amp; graphs</li>\n<li>✅ Bioavailability – factors &amp; bioequivalence</li>\n<li>✅ Pharmacokinetic Calculations – half-life, Vd, clearance</li>\n<li>✅ Non-linear Pharmacokinetics</li>\n<li>✅ Simplified diagrams &amp; solved numericals</li>\n<li>✅ GPAT &amp; University Exam focused</li>\n<li>✅ Instant PDF Download</li>\n</ul><p><em>Format: PDF Ebook | Digital Download | No physical product will be shipped.</em></p>",
    },
    {
      id: '11',
      title: `Herbal Drug Technology (B.Pharm 6th Sem)`,
      subject: `Herbal Drug Technology`,
      price: '₹49',
      year: 'Third Year',
      image: 'https://cdn.shopify.com/s/files/1/1000/3998/3418/files/rn-image_picker_lib_temp_3a453bde-95e5-4421-adc0-14fff07a76d5.png?v=1779038436',
      rating: '4.8',
      pages: 150,
      checkoutUrl: 'https://tgpcop-pharma.myshopify.com/products/herbal-drug-technology-b-pharm-sem-6',
      descriptionHtml: "<p><strong>Premium handwritten Herbal Drug Technology notes covering herbal formulations, standardization, extraction techniques and herbal product development with important exam questions.</strong></p><ul>\n<li>✅ Herbal Formulations – types &amp; development process</li>\n<li>✅ Standardization – physical, chemical &amp; biological methods</li>\n<li>✅ Extraction Techniques – modern &amp; traditional methods</li>\n<li>✅ Herbal Product Development – WHO guidelines</li>\n<li>✅ Quality Control of Herbal Drugs</li>\n<li>✅ GPAT &amp; University Exam focused</li>\n<li>✅ Unit-wise Important Questions</li>\n<li>✅ Instant PDF Download</li>\n</ul><p><em>Format: PDF Ebook | Digital Download | No physical product will be shipped.</em></p>",
    },
    {
      id: '12',
      title: `Pharmacology III (B.Pharm 6th Sem)`,
      subject: `Immunopharmacology`,
      price: '₹49',
      year: 'Third Year',
      image: 'https://cdn.shopify.com/s/files/1/1000/3998/3418/files/rn-image_picker_lib_temp_9fc6e487-4300-4362-9215-61102d659504.png?v=1779038537',
      rating: '4.8',
      pages: 150,
      checkoutUrl: 'https://tgpcop-pharma.myshopify.com/products/pharmacology-iii-b-pharm-sem-6',
      descriptionHtml: "<p><strong>Easy handwritten Pharmacology III notes including toxicology, immunopharmacology and advanced pharmacology topics prepared for semester exams and GPAT preparation.</strong></p><ul>\n<li>✅ Toxicology – general principles, antidotes &amp; poison management</li>\n<li>✅ Immunopharmacology – immunosuppressants &amp; immunostimulants</li>\n<li>✅ Advanced Pharmacology – emerging drug targets</li>\n<li>✅ Chronopharmacology &amp; Drug Interactions</li>\n<li>✅ Simplified explanations with diagrams</li>\n<li>✅ GPAT &amp; University Exam focused</li>\n<li>✅ Unit-wise Important Questions</li>\n<li>✅ Instant PDF Download</li>\n</ul><p><em>Format: PDF Ebook | Digital Download | No physical product will be shipped.</em></p>",
    },
    {
      id: '13',
      title: `Medicinal Chemistry III (B.Pharm 6th Sem)`,
      subject: `Antibiotics`,
      price: '₹49',
      year: 'Third Year',
      image: 'https://cdn.shopify.com/s/files/1/1000/3998/3418/files/rn-image_picker_lib_temp_ac8a7bee-8d42-459f-aa00-444e9e4b4443.png?v=1779038566',
      rating: '4.8',
      pages: 150,
      checkoutUrl: 'https://tgpcop-pharma.myshopify.com/products/medicinal-chemistry-iii-b-pharm-sem-6',
      descriptionHtml: "<p><strong>Comprehensive handwritten Medicinal Chemistry III notes covering antibiotics, antimalarials, antivirals and medicinal compounds with SAR and mechanism-based explanations.</strong></p><ul>\n<li>✅ Antibiotics – penicillins, cephalosporins, tetracyclines &amp; more</li>\n<li>✅ Antimalarials – classification, SAR &amp; drug profiles</li>\n<li>✅ Antivirals – mechanisms &amp; medicinal compounds</li>\n<li>✅ Structure-Activity Relationship (SAR) – simplified</li>\n<li>✅ Mechanism-based explanations with diagrams</li>\n<li>✅ GPAT &amp; University Exam focused</li>\n<li>✅ Unit-wise Important Questions</li>\n<li>✅ Instant PDF Download</li>\n</ul><p><em>Format: PDF Ebook | Digital Download | No physical product will be shipped.</em></p>",
    },
    {
      id: '14',
      title: `Pharmaceutical Jurisprudence (B.Pharm 5th Sem)`,
      subject: `Drug Act`,
      price: '₹49',
      year: 'Third Year',
      image: 'https://cdn.shopify.com/s/files/1/1000/3998/3418/files/rn-image_picker_lib_temp_6baa92e6-2e28-45af-815c-b3e8a6e71bd1.png?v=1779038596',
      rating: '4.8',
      pages: 150,
      checkoutUrl: 'https://tgpcop-pharma.myshopify.com/products/pharmaceutical-jurisprudence-b-pharm-sem-5',
      descriptionHtml: "<p><strong>Premium handwritten Pharmaceutical Jurisprudence notes covering pharmacy laws, Drug &amp; Cosmetic Act, schedules, ethics and legal requirements with simplified explanations.</strong></p><ul>\n<li>✅ Drugs &amp; Cosmetics Act – sections, rules &amp; schedules</li>\n<li>✅ Pharmacy Act – registration &amp; licensing</li>\n<li>✅ Schedules – H, H1, X, G, C &amp; others explained</li>\n<li>✅ Narcotic Drugs &amp; Psychotropic Substances Act</li>\n<li>✅ Pharmacy Ethics &amp; Professional conduct</li>\n<li>✅ Legal Requirements for Pharmacy Practice</li>\n<li>✅ Unit-wise Important Questions</li>\n<li>✅ Instant PDF Download</li>\n</ul><p><em>Format: PDF Ebook | Digital Download | No physical product will be shipped.</em></p>",
    },
    {
      id: '15',
      title: `Pharmacognosy & Phytochemistry II (B.Pharm 5th Sem)`,
      subject: `Herbal Drugs`,
      price: '₹49',
      year: 'Third Year',
      image: 'https://cdn.shopify.com/s/files/1/1000/3998/3418/files/rn-image_picker_lib_temp_288790d4-480d-4af6-a45c-d666baa428d1.png?v=1779038818',
      rating: '4.8',
      pages: 150,
      checkoutUrl: 'https://tgpcop-pharma.myshopify.com/products/pharmacognosy-phytochemistry-ii-b-pharm-sem-5',
      descriptionHtml: "<p><strong>Well-structured handwritten Pharmacognosy &amp; Phytochemistry II notes covering herbal drugs, phytoconstituents, extraction methods and medicinal plants for semester exams and GPAT preparation.</strong></p><ul>\n<li>✅ Herbal Drugs – classification &amp; identification</li>\n<li>✅ Phytoconstituents – alkaloids, glycosides, terpenes &amp; more</li>\n<li>✅ Extraction Methods – maceration, percolation, Soxhlet</li>\n<li>✅ Medicinal Plants – uses &amp; active constituents</li>\n<li>✅ Standardization of Herbal Preparations</li>\n<li>✅ GPAT &amp; University Exam focused</li>\n<li>✅ Unit-wise Important Questions</li>\n<li>✅ Instant PDF Download</li>\n</ul><p><em>Format: PDF Ebook | Digital Download | No physical product will be shipped.</em></p>",
    },
    {
      id: '16',
      title: `Pharmacology II (B.Pharm 5th Sem)`,
      subject: `Chemotherapy`,
      price: '₹49',
      year: 'Third Year',
      image: 'https://cdn.shopify.com/s/files/1/1000/3998/3418/files/WhatsAppImage2026-05-17at5.34.02PM.jpg?v=1779019464',
      rating: '4.8',
      pages: 150,
      checkoutUrl: 'https://tgpcop-pharma.myshopify.com/products/pharmacology-ii-b-pharm-sem-5',
      descriptionHtml: "<p><strong>Detailed handwritten Pharmacology II notes covering endocrine pharmacology, chemotherapy, CNS drugs and important pharmacological mechanisms with simplified diagrams and explanations.</strong></p><ul>\n<li>✅ Endocrine Pharmacology – hormones, insulin &amp; thyroid drugs</li>\n<li>✅ Chemotherapy – antibacterials, antifungals &amp; antivirals</li>\n<li>✅ CNS Drugs – sedatives, hypnotics &amp; antidepressants</li>\n<li>✅ Pharmacological Mechanisms – receptor-level diagrams</li>\n<li>✅ Simplified explanations with flowcharts</li>\n<li>✅ GPAT &amp; University Exam focused</li>\n<li>✅ Unit-wise Important Questions</li>\n<li>✅ Instant PDF Download</li>\n</ul><p><em>Format: PDF Ebook | Digital Download | No physical product will be shipped.</em></p>",
    },
    {
      id: '17',
      title: `Industrial Pharmacy I (B.Pharm 5th Sem)`,
      subject: `GMP`,
      price: '₹49',
      year: 'Third Year',
      image: 'https://cdn.shopify.com/s/files/1/1000/3998/3418/files/WhatsAppImage2026-05-17at5.30.54PM.jpg?v=1779019290',
      rating: '4.8',
      pages: 150,
      checkoutUrl: 'https://tgpcop-pharma.myshopify.com/products/industrial-pharmacy-i-b-pharm-sem-5',
      descriptionHtml: "<p><strong>Complete handwritten Industrial Pharmacy I notes including tablet manufacturing, capsules, GMP, validation, production processes and pharmaceutical industry concepts in easy exam-oriented language.</strong></p><ul>\n<li>✅ Tablet Manufacturing – granulation, compression &amp; coating</li>\n<li>✅ Capsules – hard &amp; soft gelatin formulations</li>\n<li>✅ GMP – Good Manufacturing Practices guidelines</li>\n<li>✅ Validation – process, cleaning &amp; analytical</li>\n<li>✅ Production Processes – industrial scale concepts</li>\n<li>✅ Pharmaceutical Industry Standards</li>\n<li>✅ Unit-wise Important Questions</li>\n<li>✅ Instant PDF Download</li>\n</ul><p><em>Format: PDF Ebook | Digital Download | No physical product will be shipped.</em></p>",
    },
    {
      id: '18',
      title: `Medicinal Chemistry II (B.Pharm 5th Sem)`,
      subject: `Medicinal Chemistry`,
      price: '₹49',
      year: 'Third Year',
      image: 'https://cdn.shopify.com/s/files/1/1000/3998/3418/files/WhatsAppImage2026-05-17at5.24.54PM.jpg?v=1779018918',
      rating: '4.8',
      pages: 150,
      checkoutUrl: 'https://tgpcop-pharma.myshopify.com/products/medicinal-chemistry-ii-b-pharm-sem-5',
      descriptionHtml: "<p><strong>Premium handwritten Medicinal Chemistry II notes covering antihistamines, anticonvulsants, antipsychotics, diuretics and medicinal drug synthesis with simplified explanations and exam-focused content.</strong></p><ul>\n<li>✅ Antihistamines – classification, SAR &amp; uses</li>\n<li>✅ Anticonvulsants – mechanisms &amp; drug profiles</li>\n<li>✅ Antipsychotics – typical &amp; atypical agents</li>\n<li>✅ Diuretics – types, mechanisms &amp; structures</li>\n<li>✅ Medicinal Drug Synthesis – step-by-step</li>\n<li>✅ GPAT &amp; University Exam focused</li>\n<li>✅ Unit-wise Important Questions</li>\n<li>✅ Instant PDF Download</li>\n</ul><p><em>Format: PDF Ebook | Digital Download | No physical product will be shipped.</em></p>",
    },
    {
      id: '19',
      title: `Pharmacognosy & Phytochemistry II (B.Pharm 4th Sem)`,
      subject: `Natural Products`,
      price: '₹49',
      year: 'Second Year',
      image: 'https://cdn.shopify.com/s/files/1/1000/3998/3418/files/WhatsAppImage2026-05-17at5.06.43PM.jpg?v=1779017826',
      rating: '4.8',
      pages: 150,
      checkoutUrl: 'https://tgpcop-pharma.myshopify.com/products/pharmacognosy-phytochemistry-ii-b-pharm-sem-4',
      descriptionHtml: "<p><strong>Comprehensive handwritten notes for Pharmacognosy &amp; Phytochemistry II covering traditional medicines, phytoconstituents, natural products and herbal drug studies with exam-focused content and diagrams.</strong></p><ul>\n<li>✅ Traditional Medicines – Ayurveda, Unani &amp; Siddha overview</li>\n<li>✅ Phytoconstituents – alkaloids, flavonoids, terpenoids &amp; more</li>\n<li>✅ Natural Products – extraction &amp; isolation techniques</li>\n<li>✅ Herbal Drug Studies – monographs &amp; standardization</li>\n<li>✅ Exam-focused content with diagrams</li>\n<li>✅ Unit-wise Important Questions</li>\n<li>✅ GPAT aligned coverage</li>\n<li>✅ Instant PDF Download</li>\n</ul><p><em>Format: PDF Ebook | Digital Download | No physical product will be shipped.</em></p>",
    },
    {
      id: '20',
      title: `Pharmacology I (B.Pharm 4th Sem)`,
      subject: `ANS Drugs`,
      price: '₹49',
      year: 'Second Year',
      image: 'https://cdn.shopify.com/s/files/1/1000/3998/3418/files/WhatsAppImage2026-05-17at5.00.33PM.jpg?v=1779017455',
      rating: '4.8',
      pages: 150,
      checkoutUrl: 'https://tgpcop-pharma.myshopify.com/products/pharmacology-i-b-pharm-sem-4',
      descriptionHtml: "<p><strong>Easy handwritten Pharmacology I notes covering ANS drugs, cardiovascular drugs, pharmacodynamics, pharmacokinetics and drug mechanisms with simplified explanations for university exams and GPAT preparation.</strong></p><ul>\n<li>✅ Autonomic Nervous System (ANS) Drugs – adrenergic &amp; cholinergic</li>\n<li>✅ Cardiovascular Drugs – antihypertensives, antiarrhythmics</li>\n<li>✅ Pharmacodynamics – receptor theories &amp; drug action</li>\n<li>✅ Pharmacokinetics – ADME principles</li>\n<li>✅ Drug Mechanisms – simplified with diagrams</li>\n<li>✅ GPAT &amp; University Exam focused</li>\n<li>✅ Unit-wise Important Questions</li>\n<li>✅ Instant PDF Download</li>\n</ul><p><em>Format: PDF Ebook | Digital Download | No physical product will be shipped.</em></p>",
    },
    {
      id: '21',
      title: `Physical Pharmaceutics II (B.Pharm 4th Sem)`,
      subject: `Colloids`,
      price: '₹49',
      year: 'Second Year',
      image: 'https://cdn.shopify.com/s/files/1/1000/3998/3418/files/WhatsAppImage2026-05-17at4.56.29PM.jpg?v=1779017218',
      rating: '4.8',
      pages: 150,
      checkoutUrl: 'https://tgpcop-pharma.myshopify.com/products/physical-pharmaceutics-ii-b-pharm-sem-4',
      descriptionHtml: "<p><strong>Premium handwritten notes for Physical Pharmaceutics II with unit-wise concepts on colloids, kinetics, buffers, isotonicity and stability studies.</strong></p><p>Includes diagrams, formulas and important exam questions in simplified format.</p><ul>\n<li>✅ Colloids – types, properties &amp; pharmaceutical use</li>\n<li>✅ Chemical Kinetics – orders &amp; shelf-life calculations</li>\n<li>✅ Buffers – Henderson-Hasselbalch &amp; capacity</li>\n<li>✅ Isotonicity – calculations &amp; significance</li>\n<li>✅ Stability Studies – ICH guidelines overview</li>\n<li>✅ Diagrams, formulas &amp; solved examples</li>\n<li>✅ Unit-wise Important Questions</li>\n<li>✅ Instant PDF Download</li>\n</ul><p><em>Format: PDF Ebook | Digital Download | No physical product will be shipped.</em></p>",
    },
    {
      id: '22',
      title: `Medicinal Chemistry I (B.Pharm 4th Sem)`,
      subject: `Medicinal Chemistry`,
      price: '₹49',
      year: 'Second Year',
      image: 'https://cdn.shopify.com/s/files/1/1000/3998/3418/files/WhatsAppImage2026-05-17at4.50.52PM.jpg?v=1779016900',
      rating: '4.8',
      pages: 150,
      checkoutUrl: 'https://tgpcop-pharma.myshopify.com/products/medicinal-chemistry-i-b-pharm-sem-4',
      descriptionHtml: "<p><strong>Complete handwritten Medicinal Chemistry I notes including drug classification, SAR, medicinal compounds, mechanism of action and important medicinal chemistry concepts prepared for semester exams and GPAT preparation.</strong></p><ul>\n<li>✅ Drug Classification – systematic &amp; pharmacological</li>\n<li>✅ Structure-Activity Relationship (SAR) – simplified</li>\n<li>✅ Medicinal Compounds – structures &amp; uses</li>\n<li>✅ Mechanism of Action – receptor-level explanations</li>\n<li>✅ Key Medicinal Chemistry Concepts</li>\n<li>✅ GPAT &amp; University Exam focused</li>\n<li>✅ Instant PDF Download</li>\n</ul><p><em>Format: PDF Ebook | Digital Download | No physical product will be shipped.</em></p>",
    },
    {
      id: '23',
      title: `Pharmaceutical Organic Chemistry III (B.Pharm 4th Sem)`,
      subject: `Heterocyclic`,
      price: '₹49',
      year: 'Second Year',
      image: 'https://cdn.shopify.com/s/files/1/1000/3998/3418/files/WhatsAppImage2026-05-17at4.44.24PM.jpg?v=1779016489',
      rating: '4.8',
      pages: 150,
      checkoutUrl: 'https://tgpcop-pharma.myshopify.com/products/pharmaceutical-organic-chemistry-iii-b-pharm-sem-4',
      descriptionHtml: "<p><strong>Detailed handwritten Pharmaceutical Organic Chemistry III notes covering heterocyclic compounds, medicinal compounds, reaction mechanisms and synthesis topics with easy explanations and exam-focused content for B.Pharmacy students.</strong></p><ul>\n<li>✅ Heterocyclic Compounds – classification &amp; properties</li>\n<li>✅ Reaction Mechanisms – step-by-step breakdowns</li>\n<li>✅ Medicinal Compounds – structure &amp; significance</li>\n<li>✅ Synthesis Topics – unit-wise coverage</li>\n<li>✅ Exam-focused content – GPAT aligned</li>\n<li>✅ Unit-wise Important Questions</li>\n<li>✅ Instant PDF Download</li>\n</ul><p><em>Format: PDF Ebook | Digital Download | No physical product will be shipped.</em></p>",
    },
    {
      id: '24',
      title: `Pharmacognosy & Phytochemistry I (B.Pharm 3rd Sem)`,
      subject: `Herbal`,
      price: '₹49',
      year: 'Second Year',
      image: 'https://cdn.shopify.com/s/files/1/1000/3998/3418/files/WhatsAppImage2026-05-17at4.39.45PM.jpg?v=1779016212',
      rating: '4.8',
      pages: 150,
      checkoutUrl: 'https://tgpcop-pharma.myshopify.com/products/pharmacognosy-phytochemistry-i-b-pharm-sem-3',
      descriptionHtml: "<p><strong>Premium handwritten Pharmacognosy &amp; Phytochemistry I notes covering crude drugs, plant morphology, microscopy, cultivation, phytoconstituents and herbal medicines.</strong></p><p>Includes unit-wise important topics and simplified explanations for exam preparation.</p><ul>\n<li>✅ Crude Drugs – identification &amp; classification</li>\n<li>✅ Plant Morphology – root, stem, leaf &amp; flower</li>\n<li>✅ Microscopy – cell types &amp; histology</li>\n<li>✅ Cultivation &amp; Collection of Medicinal Plants</li>\n<li>✅ Phytoconstituents – alkaloids, glycosides &amp; tannins</li>\n<li>✅ Herbal Medicines – applications &amp; monographs</li>\n<li>✅ Unit-wise Important Questions</li>\n<li>✅ Instant PDF Download</li>\n</ul><p><em>Format: PDF Ebook | Digital Download | No physical product will be shipped.</em></p>",
    },
    {
      id: '25',
      title: `Pharmaceutical Engineering (B.Pharm 3rd Sem)`,
      subject: `Heat Transfer`,
      price: '₹49',
      year: 'Second Year',
      image: 'https://cdn.shopify.com/s/files/1/1000/3998/3418/files/WhatsAppImage2026-05-17at4.37.44PM.jpg?v=1779016099',
      rating: '4.8',
      pages: 150,
      checkoutUrl: 'https://tgpcop-pharma.myshopify.com/products/pharmaceutical-engineering-b-pharm-sem-3',
      descriptionHtml: "<p><strong>Well-structured handwritten Pharmaceutical Engineering notes including heat transfer, evaporation, distillation, filtration, size reduction, drying and industrial pharmacy concepts.</strong></p><p>Prepared in easy language with diagrams and unit-wise important questions.</p><ul>\n<li>✅ Heat Transfer – conduction, convection &amp; radiation</li>\n<li>✅ Evaporation &amp; Distillation – types &amp; equipment</li>\n<li>✅ Filtration – mechanisms &amp; pharmaceutical filtration</li>\n<li>✅ Size Reduction – laws, mills &amp; equipment</li>\n<li>✅ Drying – methods &amp; dryer types</li>\n<li>✅ Industrial Pharmacy Concepts</li>\n<li>✅ Unit-wise Important Questions &amp; Diagrams</li>\n<li>✅ Instant PDF Download</li>\n</ul><p><em>Format: PDF Ebook | Digital Download | No physical product will be shipped.</em></p>",
    },
    {
      id: '26',
      title: `Pharmaceutical Microbiology (B.Pharm 3rd Sem)`,
      subject: `Pharmaceutical Microbiology`,
      price: '₹49',
      year: 'Second Year',
      image: 'https://cdn.shopify.com/s/files/1/1000/3998/3418/files/WhatsAppImage2026-05-17at4.35.43PM.jpg?v=1779016022',
      rating: '4.8',
      pages: 150,
      checkoutUrl: 'https://tgpcop-pharma.myshopify.com/products/pharmaceutical-microbiology-b-pharm-sem-3',
      descriptionHtml: "<p><strong>Complete handwritten Pharmaceutical Microbiology notes with sterilization methods, microbial growth, immunity, antibiotics, culture media and pharmaceutical applications.</strong></p><p>Ideal for university exams, viva and GPAT preparation with simplified handwritten explanations.</p><ul>\n<li>✅ Sterilization Methods – moist heat, dry heat, filtration</li>\n<li>✅ Microbial Growth – curves, factors &amp; media</li>\n<li>✅ Immunity – innate &amp; adaptive mechanisms</li>\n<li>✅ Antibiotics – classification &amp; mechanism of action</li>\n<li>✅ Culture Media – types &amp; pharmaceutical use</li>\n<li>✅ GPAT &amp; Viva focused content</li>\n<li>✅ Instant PDF Download</li>\n</ul><p><em>Format: PDF Ebook | Digital Download | No physical product will be shipped.</em></p>",
    },
    {
      id: '27',
      title: `Physical Pharmaceutics I (B.Pharm 3rd Sem)`,
      subject: `Micromeritics`,
      price: '₹49',
      year: 'Second Year',
      image: 'https://cdn.shopify.com/s/files/1/1000/3998/3418/files/WhatsAppImage2026-05-17at4.32.20PM.jpg?v=1779015763',
      rating: '4.8',
      pages: 150,
      checkoutUrl: 'https://tgpcop-pharma.myshopify.com/products/physical-pharmaceutics-i-b-pharm-sem-3',
      descriptionHtml: "<p><strong>Premium handwritten notes for Physical Pharmaceutics I covering micromeritics, rheology, surface chemistry, viscosity, complexes and pharmaceutical calculations.</strong></p><p>Easy-to-understand explanations with exam-oriented answers, diagrams and important questions for B.Pharmacy students.</p><ul>\n<li>✅ Micromeritics – particle size, flow properties</li>\n<li>✅ Rheology – viscosity &amp; flow behaviour</li>\n<li>✅ Surface Chemistry – adsorption &amp; surfactants</li>\n<li>✅ Complexes &amp; Pharmaceutical Calculations</li>\n<li>✅ Exam-oriented answers &amp; diagrams</li>\n<li>✅ Unit-wise Important Questions</li>\n<li>✅ Instant PDF Download</li>\n</ul><p><em>Format: PDF Ebook | Digital Download | No physical product will be shipped.</em></p>",
    },
    {
      id: '28',
      title: `Pharmaceutical Organic Chemistry II (B.Pharm 3rd Sem)`,
      subject: `Organic Chemistry`,
      price: '₹49',
      year: 'Second Year',
      image: 'https://cdn.shopify.com/s/files/1/1000/3998/3418/files/WhatsAppImage2026-05-17at4.28.42PM.jpg?v=1779015548',
      rating: '4.8',
      pages: 150,
      checkoutUrl: 'https://tgpcop-pharma.myshopify.com/products/pharmaceutical-organic-chemistry-ii-b-pharm-sem-3',
      descriptionHtml: "<p><strong>Premium handwritten B.Pharmacy notes for Pharmaceutical Organic Chemistry II designed for semester exam preparation, GPAT revision, viva preparation and quick concept learning.</strong></p><p>Includes reaction mechanisms, stereochemistry concepts, medicinal compounds and unit-wise important questions in simple language with diagrams and clean formatting.</p><ul>\n<li>✅ Reaction Mechanisms – detailed step-by-step</li>\n<li>✅ Stereochemistry – isomers, chirality &amp; configurations</li>\n<li>✅ Medicinal Compounds – structure &amp; pharmacy relevance</li>\n<li>✅ Unit-wise Important Questions</li>\n<li>✅ Diagrams &amp; clean formatting</li>\n<li>✅ GPAT &amp; Viva focused content</li>\n<li>✅ Instant PDF Download</li>\n</ul><p><em>Format: PDF Ebook | Digital Download | No physical product will be shipped.</em></p>",
    },
    {
      id: '29',
      title: `Environmental Sciences (B.Pharm 2nd Sem)`,
      subject: `Environmental Sciences`,
      price: '₹39',
      year: 'First Year',
      image: 'https://cdn.shopify.com/s/files/1/1000/3998/3418/files/WhatsAppImage2026-05-17at4.21.22PM.jpg?v=1779015110',
      rating: '4.8',
      pages: 150,
      checkoutUrl: 'https://tgpcop-pharma.myshopify.com/products/environmental-sciences-b-pharm-sem-2',
      descriptionHtml: "<p><strong>Easy-to-understand handwritten environmental science notes covering ecosystem, pollution, biodiversity, environmental protection and sustainability concepts for B.Pharmacy students.</strong></p><ul>\n<li>✅ Ecosystem – structure, types &amp; functions</li>\n<li>✅ Pollution – air, water, soil &amp; noise</li>\n<li>✅ Biodiversity – conservation &amp; hotspots</li>\n<li>✅ Environmental Protection &amp; Laws</li>\n<li>✅ Sustainability &amp; Green Pharmacy concepts</li>\n<li>✅ Exam-focused – PCI syllabus aligned</li>\n<li>✅ Instant PDF Download</li>\n</ul><p><em>Format: PDF Ebook | Digital Download | No physical product will be shipped.</em></p>",
    },
    {
      id: '30',
      title: `Computer Applications in Pharmacy (B.Pharm 2nd Sem)`,
      subject: `Computer Applications`,
      price: '₹39',
      year: 'First Year',
      image: 'https://cdn.shopify.com/s/files/1/1000/3998/3418/files/WhatsAppImage2026-05-17at4.18.16PM.jpg?v=1779014919',
      rating: '4.8',
      pages: 150,
      checkoutUrl: 'https://tgpcop-pharma.myshopify.com/products/computer-applications-pharmacy-b-pharm-sem-2',
      descriptionHtml: "<p><strong>Exam-focused handwritten notes covering pharmacy software, MS Office, databases, digital healthcare systems and computer applications used in pharmaceutical studies.</strong></p><ul>\n<li>✅ MS Office – Word, Excel, PowerPoint for Pharmacy</li>\n<li>✅ Pharmacy Software &amp; Digital Tools</li>\n<li>✅ Databases – basics and pharmacy applications</li>\n<li>✅ Digital Healthcare Systems overview</li>\n<li>✅ Internet &amp; Computer Fundamentals</li>\n<li>✅ Exam-focused – PCI syllabus aligned</li>\n<li>✅ Instant PDF Download</li>\n</ul><p><em>Format: PDF Ebook | Digital Download | No physical product will be shipped.</em></p>",
    },
  ];

  const filteredBooks = React.useMemo(() => studyBooks.filter(book => {
    const matchesSearch = book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.subject.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesYear = selectedYear === 'all' || book.year.toLowerCase() === selectedYear.toLowerCase();
    return matchesSearch && matchesYear;
  }), [searchQuery, selectedYear]);

  const handleYearSelect = React.useCallback((yearOpt: string) => {
    setSelectedYear(yearOpt === 'All' ? 'all' : yearOpt);
  }, []);

  return (
    <div className="relative min-h-screen bg-[#050B18] overflow-hidden pb-24">
      {/* Dynamic Molecular canvas background */}
      <ScienceBackground />

      {/* Page Header */}
      <PageHeader 
        icon={<BookOpen className="w-6 h-6 text-orange-burnt" />}
        title="Study Store"
        subtitle="Download premium pharmacy syllabus handbooks, exam keys, and scientific laboratory guides."
        breadcrumb="Store"
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-14 sm:mt-16">
        
        {/* Navigation Filters & Search bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-5 mb-10 bg-[#0D1B3E]/85 p-3 sm:p-4 rounded-2xl border border-orange-burnt/10 shadow-xl backdrop-blur-md">
          
          {/* Year select tabs */}
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            {['All', 'First Year', 'Second Year', 'Third Year', 'Fourth Year'].map((yearOpt) => {
              const active = (yearOpt === 'All' && selectedYear === 'all') || 
                (yearOpt.toLowerCase() === selectedYear.toLowerCase());
              return (
                <button
                  key={yearOpt}
                  onClick={() => handleYearSelect(yearOpt)}
                  className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-display font-bold uppercase tracking-wider transition-all select-none ${
                    active 
                      ? 'bg-gradient-to-r from-orange-burnt to-[#E06D2B] text-white shadow-md shadow-orange-burnt/25'
                      : 'text-white/60 hover:text-white hover:bg-white/5 border border-transparent hover:border-orange-burnt/20'
                  }`}
                >
                  {yearOpt}
                </button>
              );
            })}
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-80 shrink-0">
            <Search className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-white/35" />
            <input 
              type="text"
              placeholder="Search reference guides..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-[#060D1F] border border-orange-burnt/25 focus:border-orange-burnt rounded-xl py-3.5 pl-11 pr-4 text-xs sm:text-sm text-white placeholder:text-white/30 outline-none transition-all focus:ring-1 focus:ring-orange-burnt/25"
            />
          </div>
        </div>

        {/* Study Books Grid */}
        {filteredBooks.length === 0 ? (
          <div className="text-center py-20 bg-[#0D1B3E]/60 rounded-3xl border border-orange-burnt/15 max-w-lg mx-auto">
            <ShoppingBag className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <h3 className="font-display font-bold text-white/70 text-lg">No syllabus materials found</h3>
            <p className="text-white/40 text-sm mt-1">Try tweaking your search term or year filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10">
            {filteredBooks.map((book, idx) => (
              <motion.div
                key={book.id}
                onClick={() => setSelectedBook(book)}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.08 }}
                whileHover={{
                  y: -8,
                  borderColor: 'rgba(214, 90, 30, 0.45)',
                  boxShadow: '0 20px 40px -15px rgba(214, 90, 30, 0.35)',
                }}
                className="bg-[#0D1B3E]/85 border border-orange-burnt/25 rounded-2xl overflow-hidden flex flex-col justify-between transition-all duration-300 relative group h-full shadow-lg cursor-pointer"
              >
                <div>
                  {/* Zooming Book Cover Banner */}
                  <div className="h-48 sm:h-52 overflow-hidden relative border-b border-orange-burnt/10 bg-[#050B18]">
                    <img 
                      src={book.image} 
                      alt={book.title} 
                      className="w-full h-full object-contain p-4 bg-white/5 transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                      decoding="async"
                    />
                    
                    {/* Hover black sheet */}
                    <div className="absolute inset-0 bg-[#050B18]/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]" />

                    {/* Gold Year pill top-left */}
                    <span className="absolute top-3.5 left-3.5 bg-gradient-to-r from-[#F5A623] to-[#E09D2B] text-navy-dark text-[9px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full border border-white/10 shadow-lg">
                      {book.year}
                    </span>

                    {/* Orange Price Tag bottom-right */}
                    <span className="absolute bottom-3.5 right-3.5 bg-orange-burnt text-white text-xs font-display font-extrabold px-3 py-1 rounded-lg border border-white/10 shadow-lg">
                      {book.price}
                    </span>
                  </div>

                  {/* Book Metadata details */}
                  <div className="p-6 space-y-3">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#F5A623]">
                      {book.subject}
                    </span>
                    <h3 className="font-display font-bold text-white text-lg group-hover:text-orange-burnt transition-colors line-clamp-2 leading-snug">
                      {book.title}
                    </h3>
                    <div className="flex items-center space-x-4 text-[11px] text-white/50 font-sans">
                      <span>📖 {book.pages} pages</span>
                      <span>⭐ {book.rating} Rating</span>
                    </div>
                  </div>
                </div>

                {/* Purchase Button row */}
                <div className="p-6 pt-0 mt-auto">
                  <a
                    href={book.checkoutUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="w-full py-3 bg-[#060D1F] hover:bg-gradient-to-r hover:from-orange-burnt hover:to-[#E06D2B] text-white font-display text-xs sm:text-sm font-bold uppercase tracking-widest rounded-xl transition-all duration-300 border border-orange-burnt/35 hover:border-transparent active:scale-95 shadow-md flex items-center justify-center space-x-1.5"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>Buy Handbook</span>
                  </a>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Product Details Modal */}
      <AnimatePresence>
        {selectedBook && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setSelectedBook(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-3xl max-h-[90vh] bg-[#050B18] border border-orange-burnt/30 rounded-2xl shadow-2xl overflow-y-auto flex flex-col md:flex-row"
            >
              {/* Close Button */}
              <button
                onClick={() => setSelectedBook(null)}
                className="absolute top-4 right-4 z-10 p-2 bg-black/50 hover:bg-orange-burnt/80 text-white rounded-full backdrop-blur-md transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Image Section */}
              <div className="w-full md:w-2/5 bg-white/5 border-b md:border-b-0 md:border-r border-orange-burnt/20 p-6 flex flex-col items-center justify-center min-h-[300px]">
                <img 
                  src={selectedBook.image} 
                  alt={selectedBook.title}
                  className="w-full max-h-[400px] object-contain drop-shadow-2xl" 
                />
              </div>

              {/* Details Section */}
              <div className="w-full md:w-3/5 p-6 sm:p-8 flex flex-col">
                <span className="text-xs font-bold uppercase tracking-widest text-[#F5A623] mb-2">
                  {selectedBook.subject} • {selectedBook.year}
                </span>
                <h2 className="font-display font-bold text-white text-2xl sm:text-3xl leading-tight mb-4">
                  {selectedBook.title}
                </h2>
                
                <div className="flex items-center space-x-6 text-sm text-white/60 font-sans mb-6 pb-6 border-b border-white/10">
                  <span>📖 {selectedBook.pages} pages</span>
                  <span>⭐ {selectedBook.rating} Rating</span>
                  <span className="text-orange-burnt font-extrabold text-lg">{selectedBook.price}</span>
                </div>

                {/* Description Content */}
                <div 
                  className="prose prose-invert prose-sm max-w-none text-white/80 overflow-y-auto pr-2 custom-scrollbar flex-1 space-y-4 marker:text-orange-burnt"
                  dangerouslySetInnerHTML={{ __html: selectedBook.descriptionHtml || '<p>No description available.</p>' }}
                />

                {/* Action Area */}
                <div className="mt-8 pt-6 border-t border-white/10">
                  <a
                    href={selectedBook.checkoutUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-4 bg-gradient-to-r from-orange-burnt to-[#E06D2B] hover:shadow-lg hover:shadow-orange-burnt/30 text-white font-display text-sm font-bold uppercase tracking-widest rounded-xl transition-all duration-300 active:scale-95 flex items-center justify-center space-x-2"
                  >
                    <ShoppingBag className="w-5 h-5" />
                    <span>Proceed to Checkout</span>
                  </a>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Store;
