import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, Search, X, Download, Star, ChevronRight,
  GraduationCap, BookMarked, Layers, Filter, ExternalLink, ShoppingCart, Tag
} from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { ScienceBackground } from '../components/ScienceBackground';
import { Capacitor } from '@capacitor/core';

// ─── Types ──────────────────────────────────────────────────────────────────
interface StudyNote {
  id: string;
  title: string;
  subject: string;
  shortTitle: string;
  semester: number;
  year: 'First Year' | 'Second Year' | 'Third Year' | 'Fourth Year';
  price: string;
  image: string;
  rating: string;
  pages: number;
  checkoutUrl: string;
  descriptionHtml: string;
  tags: string[];
  formats: string[];
}

// ─── Product Data (from tgpcop-pharma.myshopify.com) ────────────────────────
const studyNotes: StudyNote[] = [
  // ── First Year ──
  {
    id: '1',
    title: 'Human Anatomy & Physiology II Handwritten Notes | B.Pharm 1st Year 2nd Semester | TGPCOP NOTES',
    shortTitle: 'Human Anatomy & Physiology II',
    subject: 'Anatomy & Physiology',
    semester: 2,
    year: 'First Year',
    price: '₹149',
    image: 'https://cdn.shopify.com/s/files/1/1000/3998/3418/files/WhatsAppImage2026-05-14at6.55.57PM.jpg?v=1778765210',
    rating: '4.8',
    pages: 150,
    checkoutUrl: 'https://tgpcop-pharma.myshopify.com/products/human-anatomy-physiology-ii-b-pharm-sem-2-tgpcop',
    descriptionHtml: '<p>TGPCOP NOTES presents premium handwritten Human Anatomy &amp; Physiology II notes specially designed for B.Pharm 1st Year 2nd Semester students.</p><p>These notes are prepared in an easy-to-understand format with colorful diagrams, flowcharts, important university questions, and quick revision points to help students score better in exams.</p><ul><li>✅ Detailed handwritten notes</li><li>✅ Important diagrams &amp; labeled figures</li><li>✅ Exam-oriented content</li><li>✅ PYQs &amp; viva questions</li><li>✅ Quick revision format</li><li>✅ Easy language for fast learning</li><li>✅ Mobile &amp; PDF friendly notes</li></ul>',
    tags: ['Anatomy PDF', 'BPharm', 'Handwritten Notes', 'HAP 2', 'Human Anatomy Notes'],
    formats: ['PDF Ebook', 'B&W Printed', 'Color Printed'],
  },
  {
    id: '29',
    title: 'Environmental Sciences (B.Pharm 2nd Sem)',
    shortTitle: 'Environmental Sciences',
    subject: 'Environmental Sciences',
    semester: 2,
    year: 'First Year',
    price: '₹39',
    image: 'https://cdn.shopify.com/s/files/1/1000/3998/3418/files/WhatsAppImage2026-05-17at4.21.22PM.jpg?v=1779015110',
    rating: '4.8',
    pages: 150,
    checkoutUrl: 'https://tgpcop-pharma.myshopify.com/products/environmental-sciences-b-pharm-sem-2',
    descriptionHtml: '<p><strong>Easy-to-understand handwritten environmental science notes covering ecosystem, pollution, biodiversity, environmental protection and sustainability concepts for B.Pharmacy students.</strong></p><ul><li>✅ Ecosystem – structure, types &amp; functions</li><li>✅ Pollution – air, water, soil &amp; noise</li><li>✅ Biodiversity – conservation &amp; hotspots</li><li>✅ Environmental Protection &amp; Laws</li><li>✅ Sustainability &amp; Green Pharmacy concepts</li><li>✅ Exam-focused – PCI syllabus aligned</li></ul>',
    tags: ['Environmental Sciences', 'BPharm', 'Semester 2'],
    formats: ['PDF Ebook'],
  },
  {
    id: '30',
    title: 'Computer Applications in Pharmacy (B.Pharm 2nd Sem)',
    shortTitle: 'Computer Applications in Pharmacy',
    subject: 'Computer Applications',
    semester: 2,
    year: 'First Year',
    price: '₹39',
    image: 'https://cdn.shopify.com/s/files/1/1000/3998/3418/files/WhatsAppImage2026-05-17at4.18.16PM.jpg?v=1779014919',
    rating: '4.8',
    pages: 150,
    checkoutUrl: 'https://tgpcop-pharma.myshopify.com/products/computer-applications-pharmacy-b-pharm-sem-2',
    descriptionHtml: '<p><strong>Exam-focused handwritten notes covering pharmacy software, MS Office, databases, digital healthcare systems and computer applications used in pharmaceutical studies.</strong></p><ul><li>✅ MS Office – Word, Excel, PowerPoint for Pharmacy</li><li>✅ Pharmacy Software &amp; Digital Tools</li><li>✅ Databases – basics and pharmacy applications</li><li>✅ Digital Healthcare Systems overview</li></ul>',
    tags: ['Computer Applications', 'BPharm', 'Semester 2'],
    formats: ['PDF Ebook'],
  },
  // ── Second Year ──
  {
    id: '24',
    title: 'Pharmacognosy & Phytochemistry I (B.Pharm 3rd Sem)',
    shortTitle: 'Pharmacognosy & Phytochemistry I',
    subject: 'Pharmacognosy',
    semester: 3,
    year: 'Second Year',
    price: '₹49',
    image: 'https://cdn.shopify.com/s/files/1/1000/3998/3418/files/WhatsAppImage2026-05-17at4.39.45PM.jpg?v=1779016212',
    rating: '4.8',
    pages: 150,
    checkoutUrl: 'https://tgpcop-pharma.myshopify.com/products/pharmacognosy-phytochemistry-i-b-pharm-sem-3',
    descriptionHtml: '<p><strong>Premium handwritten Pharmacognosy &amp; Phytochemistry I notes covering crude drugs, plant morphology, microscopy, cultivation, phytoconstituents and herbal medicines.</strong></p><ul><li>✅ Crude Drugs – identification &amp; classification</li><li>✅ Plant Morphology – root, stem, leaf &amp; flower</li><li>✅ Microscopy – cell types &amp; histology</li><li>✅ Cultivation &amp; Collection of Medicinal Plants</li><li>✅ Phytoconstituents – alkaloids, glycosides &amp; tannins</li></ul>',
    tags: ['Pharmacognosy', 'BPharm', 'Semester 3'],
    formats: ['PDF Ebook'],
  },
  {
    id: '25',
    title: 'Pharmaceutical Engineering (B.Pharm 3rd Sem)',
    shortTitle: 'Pharmaceutical Engineering',
    subject: 'Pharmaceutical Engineering',
    semester: 3,
    year: 'Second Year',
    price: '₹49',
    image: 'https://cdn.shopify.com/s/files/1/1000/3998/3418/files/WhatsAppImage2026-05-17at4.37.44PM.jpg?v=1779016099',
    rating: '4.8',
    pages: 150,
    checkoutUrl: 'https://tgpcop-pharma.myshopify.com/products/pharmaceutical-engineering-b-pharm-sem-3',
    descriptionHtml: '<p><strong>Well-structured handwritten Pharmaceutical Engineering notes including heat transfer, evaporation, distillation, filtration, size reduction, drying and industrial pharmacy concepts.</strong></p><ul><li>✅ Heat Transfer – conduction, convection &amp; radiation</li><li>✅ Evaporation &amp; Distillation – types &amp; equipment</li><li>✅ Filtration – mechanisms</li><li>✅ Size Reduction – laws, mills &amp; equipment</li><li>✅ Drying – methods &amp; dryer types</li></ul>',
    tags: ['Pharmaceutical Engineering', 'BPharm', 'Semester 3'],
    formats: ['PDF Ebook'],
  },
  {
    id: '26',
    title: 'Pharmaceutical Microbiology (B.Pharm 3rd Sem)',
    shortTitle: 'Pharmaceutical Microbiology',
    subject: 'Microbiology',
    semester: 3,
    year: 'Second Year',
    price: '₹49',
    image: 'https://cdn.shopify.com/s/files/1/1000/3998/3418/files/WhatsAppImage2026-05-17at4.35.43PM.jpg?v=1779016022',
    rating: '4.8',
    pages: 150,
    checkoutUrl: 'https://tgpcop-pharma.myshopify.com/products/pharmaceutical-microbiology-b-pharm-sem-3',
    descriptionHtml: '<p><strong>Complete handwritten Pharmaceutical Microbiology notes with sterilization methods, microbial growth, immunity, antibiotics, culture media and pharmaceutical applications.</strong></p><ul><li>✅ Sterilization Methods – moist heat, dry heat, filtration</li><li>✅ Microbial Growth – curves, factors &amp; media</li><li>✅ Immunity – innate &amp; adaptive mechanisms</li><li>✅ Antibiotics – classification &amp; mechanism of action</li></ul>',
    tags: ['Microbiology', 'BPharm', 'Semester 3'],
    formats: ['PDF Ebook'],
  },
  {
    id: '27',
    title: 'Physical Pharmaceutics I (B.Pharm 3rd Sem)',
    shortTitle: 'Physical Pharmaceutics I',
    subject: 'Physical Pharmaceutics',
    semester: 3,
    year: 'Second Year',
    price: '₹49',
    image: 'https://cdn.shopify.com/s/files/1/1000/3998/3418/files/WhatsAppImage2026-05-17at4.32.20PM.jpg?v=1779015763',
    rating: '4.8',
    pages: 150,
    checkoutUrl: 'https://tgpcop-pharma.myshopify.com/products/physical-pharmaceutics-i-b-pharm-sem-3',
    descriptionHtml: '<p><strong>Premium handwritten notes for Physical Pharmaceutics I covering micromeritics, rheology, surface chemistry, viscosity, complexes and pharmaceutical calculations.</strong></p><ul><li>✅ Micromeritics – particle size, flow properties</li><li>✅ Rheology – viscosity &amp; flow behaviour</li><li>✅ Surface Chemistry – adsorption &amp; surfactants</li><li>✅ Complexes &amp; Pharmaceutical Calculations</li></ul>',
    tags: ['Physical Pharmaceutics', 'BPharm', 'Semester 3'],
    formats: ['PDF Ebook'],
  },
  {
    id: '28',
    title: 'Pharmaceutical Organic Chemistry II (B.Pharm 3rd Sem)',
    shortTitle: 'Pharmaceutical Organic Chemistry II',
    subject: 'Organic Chemistry',
    semester: 3,
    year: 'Second Year',
    price: '₹49',
    image: 'https://cdn.shopify.com/s/files/1/1000/3998/3418/files/WhatsAppImage2026-05-17at4.28.42PM.jpg?v=1779015548',
    rating: '4.8',
    pages: 150,
    checkoutUrl: 'https://tgpcop-pharma.myshopify.com/products/pharmaceutical-organic-chemistry-ii-b-pharm-sem-3',
    descriptionHtml: '<p><strong>Premium handwritten B.Pharmacy notes for Pharmaceutical Organic Chemistry II designed for semester exam preparation, GPAT revision, viva preparation and quick concept learning.</strong></p><ul><li>✅ Reaction Mechanisms – detailed step-by-step</li><li>✅ Stereochemistry – isomers, chirality &amp; configurations</li><li>✅ Medicinal Compounds – structure &amp; pharmacy relevance</li></ul>',
    tags: ['Organic Chemistry', 'BPharm', 'Semester 3'],
    formats: ['PDF Ebook'],
  },
  {
    id: '19',
    title: 'Pharmacognosy & Phytochemistry II (B.Pharm 4th Sem)',
    shortTitle: 'Pharmacognosy & Phytochemistry II',
    subject: 'Natural Products',
    semester: 4,
    year: 'Second Year',
    price: '₹49',
    image: 'https://cdn.shopify.com/s/files/1/1000/3998/3418/files/WhatsAppImage2026-05-17at5.06.43PM.jpg?v=1779017826',
    rating: '4.8',
    pages: 150,
    checkoutUrl: 'https://tgpcop-pharma.myshopify.com/products/pharmacognosy-phytochemistry-ii-b-pharm-sem-4',
    descriptionHtml: '<p><strong>Comprehensive handwritten notes for Pharmacognosy &amp; Phytochemistry II covering traditional medicines, phytoconstituents, natural products and herbal drug studies with exam-focused content and diagrams.</strong></p><ul><li>✅ Traditional Medicines – Ayurveda, Unani &amp; Siddha overview</li><li>✅ Phytoconstituents – alkaloids, flavonoids, terpenoids &amp; more</li><li>✅ Natural Products – extraction &amp; isolation techniques</li></ul>',
    tags: ['Natural Products', 'BPharm', 'Semester 4'],
    formats: ['PDF Ebook'],
  },
  {
    id: '20',
    title: 'Pharmacology I (B.Pharm 4th Sem)',
    shortTitle: 'Pharmacology I',
    subject: 'ANS Drugs',
    semester: 4,
    year: 'Second Year',
    price: '₹49',
    image: 'https://cdn.shopify.com/s/files/1/1000/3998/3418/files/WhatsAppImage2026-05-17at5.00.33PM.jpg?v=1779017455',
    rating: '4.8',
    pages: 150,
    checkoutUrl: 'https://tgpcop-pharma.myshopify.com/products/pharmacology-i-b-pharm-sem-4',
    descriptionHtml: '<p><strong>Easy handwritten Pharmacology I notes covering ANS drugs, cardiovascular drugs, pharmacodynamics, pharmacokinetics and drug mechanisms with simplified explanations for university exams and GPAT preparation.</strong></p><ul><li>✅ Autonomic Nervous System (ANS) Drugs – adrenergic &amp; cholinergic</li><li>✅ Cardiovascular Drugs – antihypertensives, antiarrhythmics</li><li>✅ Pharmacodynamics – receptor theories &amp; drug action</li></ul>',
    tags: ['Pharmacology', 'ANS', 'BPharm', 'Semester 4'],
    formats: ['PDF Ebook'],
  },
  {
    id: '21',
    title: 'Physical Pharmaceutics II (B.Pharm 4th Sem)',
    shortTitle: 'Physical Pharmaceutics II',
    subject: 'Colloids',
    semester: 4,
    year: 'Second Year',
    price: '₹49',
    image: 'https://cdn.shopify.com/s/files/1/1000/3998/3418/files/WhatsAppImage2026-05-17at4.56.29PM.jpg?v=1779017218',
    rating: '4.8',
    pages: 150,
    checkoutUrl: 'https://tgpcop-pharma.myshopify.com/products/physical-pharmaceutics-ii-b-pharm-sem-4',
    descriptionHtml: '<p><strong>Premium handwritten notes for Physical Pharmaceutics II with unit-wise concepts on colloids, kinetics, buffers, isotonicity and stability studies.</strong></p><ul><li>✅ Colloids – types, properties &amp; pharmaceutical use</li><li>✅ Chemical Kinetics – orders &amp; shelf-life calculations</li><li>✅ Buffers – Henderson-Hasselbalch &amp; capacity</li><li>✅ Isotonicity – calculations &amp; significance</li></ul>',
    tags: ['Physical Pharmaceutics', 'BPharm', 'Semester 4'],
    formats: ['PDF Ebook'],
  },
  {
    id: '22',
    title: 'Medicinal Chemistry I (B.Pharm 4th Sem)',
    shortTitle: 'Medicinal Chemistry I',
    subject: 'Medicinal Chemistry',
    semester: 4,
    year: 'Second Year',
    price: '₹49',
    image: 'https://cdn.shopify.com/s/files/1/1000/3998/3418/files/WhatsAppImage2026-05-17at4.50.52PM.jpg?v=1779016900',
    rating: '4.8',
    pages: 150,
    checkoutUrl: 'https://tgpcop-pharma.myshopify.com/products/medicinal-chemistry-i-b-pharm-sem-4',
    descriptionHtml: '<p><strong>Complete handwritten Medicinal Chemistry I notes including drug classification, SAR, medicinal compounds, mechanism of action and important medicinal chemistry concepts.</strong></p><ul><li>✅ Drug Classification – systematic &amp; pharmacological</li><li>✅ Structure-Activity Relationship (SAR) – simplified</li><li>✅ Medicinal Compounds – structures &amp; uses</li></ul>',
    tags: ['Medicinal Chemistry', 'BPharm', 'Semester 4'],
    formats: ['PDF Ebook'],
  },
  {
    id: '23',
    title: 'Pharmaceutical Organic Chemistry III (B.Pharm 4th Sem)',
    shortTitle: 'Pharmaceutical Organic Chemistry III',
    subject: 'Heterocyclic Chemistry',
    semester: 4,
    year: 'Second Year',
    price: '₹49',
    image: 'https://cdn.shopify.com/s/files/1/1000/3998/3418/files/WhatsAppImage2026-05-17at4.44.24PM.jpg?v=1779016489',
    rating: '4.8',
    pages: 150,
    checkoutUrl: 'https://tgpcop-pharma.myshopify.com/products/pharmaceutical-organic-chemistry-iii-b-pharm-sem-4',
    descriptionHtml: '<p><strong>Detailed handwritten Pharmaceutical Organic Chemistry III notes covering heterocyclic compounds, medicinal compounds, reaction mechanisms and synthesis topics.</strong></p><ul><li>✅ Heterocyclic Compounds – classification &amp; properties</li><li>✅ Reaction Mechanisms – step-by-step breakdowns</li><li>✅ Medicinal Compounds – structure &amp; significance</li></ul>',
    tags: ['Heterocyclic', 'Organic Chemistry', 'BPharm', 'Semester 4'],
    formats: ['PDF Ebook'],
  },
  // ── Third Year ──
  {
    id: '14',
    title: 'Pharmaceutical Jurisprudence (B.Pharm 5th Sem)',
    shortTitle: 'Pharmaceutical Jurisprudence',
    subject: 'Pharmacy Law',
    semester: 5,
    year: 'Third Year',
    price: '₹49',
    image: 'https://cdn.shopify.com/s/files/1/1000/3998/3418/files/rn-image_picker_lib_temp_6baa92e6-2e28-45af-815c-b3e8a6e71bd1.png?v=1779038596',
    rating: '4.8',
    pages: 150,
    checkoutUrl: 'https://tgpcop-pharma.myshopify.com/products/pharmaceutical-jurisprudence-b-pharm-sem-5',
    descriptionHtml: '<p><strong>Premium handwritten Pharmaceutical Jurisprudence notes covering pharmacy laws, Drug &amp; Cosmetic Act, schedules, ethics and legal requirements with simplified explanations.</strong></p><ul><li>✅ Drugs &amp; Cosmetics Act – sections, rules &amp; schedules</li><li>✅ Pharmacy Act – registration &amp; licensing</li><li>✅ Schedules – H, H1, X, G, C &amp; others explained</li><li>✅ Narcotic Drugs &amp; Psychotropic Substances Act</li></ul>',
    tags: ['Drug Act', 'Jurisprudence', 'BPharm', 'Semester 5'],
    formats: ['PDF Ebook'],
  },
  {
    id: '15',
    title: 'Pharmacognosy & Phytochemistry II (B.Pharm 5th Sem)',
    shortTitle: 'Pharmacognosy & Phytochemistry II (5th Sem)',
    subject: 'Herbal Drugs',
    semester: 5,
    year: 'Third Year',
    price: '₹49',
    image: 'https://cdn.shopify.com/s/files/1/1000/3998/3418/files/rn-image_picker_lib_temp_288790d4-480d-4af6-a45c-d666baa428d1.png?v=1779038818',
    rating: '4.8',
    pages: 150,
    checkoutUrl: 'https://tgpcop-pharma.myshopify.com/products/pharmacognosy-phytochemistry-ii-b-pharm-sem-5',
    descriptionHtml: '<p><strong>Well-structured handwritten Pharmacognosy &amp; Phytochemistry II notes covering herbal drugs, phytoconstituents, extraction methods and medicinal plants for semester exams and GPAT preparation.</strong></p><ul><li>✅ Herbal Drugs – classification &amp; identification</li><li>✅ Phytoconstituents – alkaloids, glycosides, terpenes &amp; more</li><li>✅ Extraction Methods – maceration, percolation, Soxhlet</li></ul>',
    tags: ['Herbal Drugs', 'BPharm', 'Semester 5'],
    formats: ['PDF Ebook'],
  },
  {
    id: '16',
    title: 'Pharmacology II (B.Pharm 5th Sem)',
    shortTitle: 'Pharmacology II',
    subject: 'Chemotherapy',
    semester: 5,
    year: 'Third Year',
    price: '₹49',
    image: 'https://cdn.shopify.com/s/files/1/1000/3998/3418/files/WhatsAppImage2026-05-17at5.34.02PM.jpg?v=1779019464',
    rating: '4.8',
    pages: 150,
    checkoutUrl: 'https://tgpcop-pharma.myshopify.com/products/pharmacology-ii-b-pharm-sem-5',
    descriptionHtml: '<p><strong>Detailed handwritten Pharmacology II notes covering endocrine pharmacology, chemotherapy, CNS drugs and important pharmacological mechanisms.</strong></p><ul><li>✅ Endocrine Pharmacology – hormones, insulin &amp; thyroid drugs</li><li>✅ Chemotherapy – antibacterials, antifungals &amp; antivirals</li><li>✅ CNS Drugs – sedatives, hypnotics &amp; antidepressants</li></ul>',
    tags: ['Pharmacology', 'Chemotherapy', 'BPharm', 'Semester 5'],
    formats: ['PDF Ebook'],
  },
  {
    id: '17',
    title: 'Industrial Pharmacy I (B.Pharm 5th Sem)',
    shortTitle: 'Industrial Pharmacy I',
    subject: 'Industrial Pharmacy',
    semester: 5,
    year: 'Third Year',
    price: '₹49',
    image: 'https://cdn.shopify.com/s/files/1/1000/3998/3418/files/WhatsAppImage2026-05-17at5.30.54PM.jpg?v=1779019290',
    rating: '4.8',
    pages: 150,
    checkoutUrl: 'https://tgpcop-pharma.myshopify.com/products/industrial-pharmacy-i-b-pharm-sem-5',
    descriptionHtml: '<p><strong>Complete handwritten Industrial Pharmacy I notes including tablet manufacturing, capsules, GMP, validation, production processes and pharmaceutical industry concepts.</strong></p><ul><li>✅ Tablet Manufacturing – granulation, compression &amp; coating</li><li>✅ Capsules – hard &amp; soft gelatin formulations</li><li>✅ GMP – Good Manufacturing Practices guidelines</li></ul>',
    tags: ['GMP', 'Industrial Pharmacy', 'BPharm', 'Semester 5'],
    formats: ['PDF Ebook'],
  },
  {
    id: '18',
    title: 'Medicinal Chemistry II (B.Pharm 5th Sem)',
    shortTitle: 'Medicinal Chemistry II',
    subject: 'Medicinal Chemistry',
    semester: 5,
    year: 'Third Year',
    price: '₹49',
    image: 'https://cdn.shopify.com/s/files/1/1000/3998/3418/files/WhatsAppImage2026-05-17at5.24.54PM.jpg?v=1779018918',
    rating: '4.8',
    pages: 150,
    checkoutUrl: 'https://tgpcop-pharma.myshopify.com/products/medicinal-chemistry-ii-b-pharm-sem-5',
    descriptionHtml: '<p><strong>Premium handwritten Medicinal Chemistry II notes covering antihistamines, anticonvulsants, antipsychotics, diuretics and medicinal drug synthesis.</strong></p><ul><li>✅ Antihistamines – classification, SAR &amp; uses</li><li>✅ Anticonvulsants – mechanisms &amp; drug profiles</li><li>✅ Antipsychotics – typical &amp; atypical agents</li></ul>',
    tags: ['Medicinal Chemistry', 'BPharm', 'Semester 5'],
    formats: ['PDF Ebook'],
  },
  {
    id: '9',
    title: 'Quality Assurance (B.Pharm 6th Sem)',
    shortTitle: 'Quality Assurance',
    subject: 'Quality Assurance',
    semester: 6,
    year: 'Third Year',
    price: '₹49',
    image: 'https://cdn.shopify.com/s/files/1/1000/3998/3418/files/WhatsAppImage2026-05-17at5.57.54PM.jpg?v=1779020892',
    rating: '4.8',
    pages: 150,
    checkoutUrl: 'https://tgpcop-pharma.myshopify.com/products/quality-assurance-b-pharm-sem-6',
    descriptionHtml: '<p><strong>Complete handwritten Quality Assurance notes covering GMP, validation, QA systems, SOPs and pharmaceutical quality control concepts in easy language.</strong></p><ul><li>✅ GMP – Good Manufacturing Practices (Schedule M)</li><li>✅ Validation – process, cleaning, equipment &amp; analytical</li><li>✅ QA Systems – ISO, ICH guidelines overview</li></ul>',
    tags: ['GMP', 'Quality Assurance', 'BPharm', 'Semester 6'],
    formats: ['PDF Ebook', 'B&W Printed', 'Color Printed'],
  },
  {
    id: '10',
    title: 'Biopharmaceutics & Pharmacokinetics (B.Pharm 6th Sem)',
    shortTitle: 'Biopharmaceutics & Pharmacokinetics',
    subject: 'Biopharmaceutics',
    semester: 6,
    year: 'Third Year',
    price: '₹49',
    image: 'https://cdn.shopify.com/s/files/1/1000/3998/3418/files/WhatsAppImage2026-05-17at10.35.57PM.jpg?v=1779037603',
    rating: '4.8',
    pages: 150,
    checkoutUrl: 'https://tgpcop-pharma.myshopify.com/products/biopharmaceutics-pharmacokinetics-b-pharm-sem-6',
    descriptionHtml: '<p><strong>Detailed handwritten Biopharmaceutics &amp; Pharmacokinetics notes including ADME, compartment models, bioavailability and pharmacokinetic calculations with simplified diagrams.</strong></p><ul><li>✅ ADME – absorption, distribution, metabolism &amp; excretion</li><li>✅ One &amp; Two Compartment Models – equations &amp; graphs</li><li>✅ Bioavailability – factors &amp; bioequivalence</li></ul>',
    tags: ['Biopharmaceutics', 'ADME', 'BPharm', 'Semester 6'],
    formats: ['PDF Ebook', 'B&W Printed', 'Color Printed'],
  },
  {
    id: '11',
    title: 'Herbal Drug Technology (B.Pharm 6th Sem)',
    shortTitle: 'Herbal Drug Technology',
    subject: 'Herbal Technology',
    semester: 6,
    year: 'Third Year',
    price: '₹49',
    image: 'https://cdn.shopify.com/s/files/1/1000/3998/3418/files/rn-image_picker_lib_temp_3a453bde-95e5-4421-adc0-14fff07a76d5.png?v=1779038436',
    rating: '4.8',
    pages: 150,
    checkoutUrl: 'https://tgpcop-pharma.myshopify.com/products/herbal-drug-technology-b-pharm-sem-6',
    descriptionHtml: '<p><strong>Premium handwritten Herbal Drug Technology notes covering herbal formulations, standardization, extraction techniques and herbal product development.</strong></p><ul><li>✅ Herbal Formulations – types &amp; development process</li><li>✅ Standardization – physical, chemical &amp; biological methods</li><li>✅ Extraction Techniques – modern &amp; traditional methods</li></ul>',
    tags: ['Herbal Drug Technology', 'BPharm', 'Semester 6'],
    formats: ['PDF Ebook', 'B&W Printed', 'Color Printed'],
  },
  {
    id: '12',
    title: 'Pharmacology III (B.Pharm 6th Sem)',
    shortTitle: 'Pharmacology III',
    subject: 'Immunopharmacology',
    semester: 6,
    year: 'Third Year',
    price: '₹49',
    image: 'https://cdn.shopify.com/s/files/1/1000/3998/3418/files/rn-image_picker_lib_temp_9fc6e487-4300-4362-9215-61102d659504.png?v=1779038537',
    rating: '4.8',
    pages: 150,
    checkoutUrl: 'https://tgpcop-pharma.myshopify.com/products/pharmacology-iii-b-pharm-sem-6',
    descriptionHtml: '<p><strong>Easy handwritten Pharmacology III notes including toxicology, immunopharmacology and advanced pharmacology topics.</strong></p><ul><li>✅ Toxicology – general principles, antidotes &amp; poison management</li><li>✅ Immunopharmacology – immunosuppressants &amp; immunostimulants</li><li>✅ Chronopharmacology &amp; Drug Interactions</li></ul>',
    tags: ['Pharmacology', 'Immunopharmacology', 'BPharm', 'Semester 6'],
    formats: ['PDF Ebook', 'B&W Printed', 'Color Printed'],
  },
  {
    id: '13',
    title: 'Medicinal Chemistry III (B.Pharm 6th Sem)',
    shortTitle: 'Medicinal Chemistry III',
    subject: 'Antibiotics Chemistry',
    semester: 6,
    year: 'Third Year',
    price: '₹49',
    image: 'https://cdn.shopify.com/s/files/1/1000/3998/3418/files/rn-image_picker_lib_temp_ac8a7bee-8d42-459f-aa00-444e9e4b4443.png?v=1779038566',
    rating: '4.8',
    pages: 150,
    checkoutUrl: 'https://tgpcop-pharma.myshopify.com/products/medicinal-chemistry-iii-b-pharm-sem-6',
    descriptionHtml: '<p><strong>Comprehensive handwritten Medicinal Chemistry III notes covering antibiotics, antimalarials, antivirals and medicinal compounds with SAR and mechanism-based explanations.</strong></p><ul><li>✅ Antibiotics – penicillins, cephalosporins, tetracyclines &amp; more</li><li>✅ Antimalarials – classification, SAR &amp; drug profiles</li><li>✅ Antivirals – mechanisms &amp; medicinal compounds</li></ul>',
    tags: ['Antibiotics', 'Medicinal Chemistry', 'BPharm', 'Semester 6'],
    formats: ['PDF Ebook', 'B&W Printed', 'Color Printed'],
  },
  // ── Fourth Year ──
  {
    id: '5',
    title: 'Novel Drug Delivery System (B.Pharm 7th Sem)',
    shortTitle: 'Novel Drug Delivery System',
    subject: 'NDDS / Nanotechnology',
    semester: 7,
    year: 'Fourth Year',
    price: '₹49',
    image: 'https://cdn.shopify.com/s/files/1/1000/3998/3418/files/WhatsAppImage2026-05-17at5.43.20PM.jpg?v=1779020026',
    rating: '4.8',
    pages: 150,
    checkoutUrl: 'https://tgpcop-pharma.myshopify.com/products/novel-drug-delivery-system-b-pharm-sem-7',
    descriptionHtml: '<p><strong>Premium handwritten NDDS notes including liposomes, nanoparticles, transdermal systems and advanced drug delivery technologies.</strong></p><ul><li>✅ Liposomes – preparation, types &amp; pharmaceutical uses</li><li>✅ Nanoparticles – polymeric, solid lipid &amp; dendrimers</li><li>✅ Transdermal Drug Delivery – patches &amp; penetration enhancers</li><li>✅ Controlled Release Systems – matrix &amp; reservoir types</li></ul>',
    tags: ['NDDS', 'Nanotechnology', 'BPharm', 'Semester 7'],
    formats: ['PDF Ebook', 'B&W Printed', 'Color Printed'],
  },
  {
    id: '6',
    title: 'Pharmacy Practice (B.Pharm 7th Sem)',
    shortTitle: 'Pharmacy Practice',
    subject: 'Clinical Pharmacy',
    semester: 7,
    year: 'Fourth Year',
    price: '₹49',
    image: 'https://cdn.shopify.com/s/files/1/1000/3998/3418/files/WhatsAppImage2026-05-17at5.48.25PM.jpg?v=1779020328',
    rating: '4.8',
    pages: 150,
    checkoutUrl: 'https://tgpcop-pharma.myshopify.com/products/pharmacy-practice-b-pharm-sem-7',
    descriptionHtml: '<p><strong>Complete handwritten Pharmacy Practice notes covering clinical pharmacy, patient counseling, hospital pharmacy and prescription handling.</strong></p><ul><li>✅ Clinical Pharmacy – drug therapy monitoring &amp; rational use</li><li>✅ Patient Counseling – communication skills &amp; medication advice</li><li>✅ Hospital Pharmacy – dispensing, procurement &amp; store management</li></ul>',
    tags: ['Clinical Pharmacy', 'BPharm', 'Semester 7'],
    formats: ['PDF Ebook', 'B&W Printed', 'Color Printed'],
  },
  {
    id: '7',
    title: 'Industrial Pharmacy II (B.Pharm 7th Sem)',
    shortTitle: 'Industrial Pharmacy II',
    subject: 'Industrial Pharmacy',
    semester: 7,
    year: 'Fourth Year',
    price: '₹49',
    image: 'https://cdn.shopify.com/s/files/1/1000/3998/3418/files/WhatsAppImage2026-05-17at5.52.17PM.jpg?v=1779020565',
    rating: '4.8',
    pages: 150,
    checkoutUrl: 'https://tgpcop-pharma.myshopify.com/products/industrial-pharmacy-ii-b-pharm-sem-7',
    descriptionHtml: '<p><strong>Detailed handwritten Industrial Pharmacy II notes including scale-up techniques, technology transfer, validation and pharmaceutical production concepts.</strong></p><ul><li>✅ Scale-up Techniques – pilot to commercial scale</li><li>✅ Technology Transfer – process &amp; documentation</li><li>✅ Validation – equipment, process &amp; cleaning</li></ul>',
    tags: ['Industrial Pharmacy', 'BPharm', 'Semester 7'],
    formats: ['PDF Ebook', 'B&W Printed', 'Color Printed'],
  },
  {
    id: '8',
    title: 'Instrumental Methods of Analysis (B.Pharm 7th Sem)',
    shortTitle: 'Instrumental Methods of Analysis',
    subject: 'Analytical Chemistry',
    semester: 7,
    year: 'Fourth Year',
    price: '₹49',
    image: 'https://cdn.shopify.com/s/files/1/1000/3998/3418/files/WhatsAppImage2026-05-17at5.56.40PM.jpg?v=1779020823',
    rating: '4.8',
    pages: 150,
    checkoutUrl: 'https://tgpcop-pharma.myshopify.com/products/instrumental-methods-analysis-b-pharm-sem-7',
    descriptionHtml: '<p><strong>Premium handwritten Instrumental Methods of Analysis notes covering spectroscopy, chromatography and analytical techniques.</strong></p><ul><li>✅ Spectroscopy – UV-Visible, IR, NMR &amp; Mass Spectrometry</li><li>✅ Chromatography – TLC, HPLC, GC &amp; column chromatography</li><li>✅ Analytical Techniques – flame photometry, AAS &amp; more</li></ul>',
    tags: ['Chromatography', 'Spectroscopy', 'BPharm', 'Semester 7'],
    formats: ['PDF Ebook', 'B&W Printed', 'Color Printed'],
  },
  {
    id: '2',
    title: 'Pharmaceutical Marketing Management (B.Pharm 8th Sem)',
    shortTitle: 'Pharmaceutical Marketing Management',
    subject: 'Marketing Management',
    semester: 8,
    year: 'Fourth Year',
    price: '₹49',
    image: 'https://cdn.shopify.com/s/files/1/1000/3998/3418/files/rn-image_picker_lib_temp_cdfe768a-a5b9-4009-bccc-b108f011e7dd.png?v=1779039248',
    rating: '4.8',
    pages: 150,
    checkoutUrl: 'https://tgpcop-pharma.myshopify.com/products/pharmaceutical-marketing-management-b-pharm-sem-8',
    descriptionHtml: '<p><strong>Premium handwritten Pharmaceutical Marketing Management notes covering pharmaceutical sales, marketing strategies, product management and healthcare marketing concepts.</strong></p><ul><li>✅ Pharmaceutical Sales – detailing, territory management</li><li>✅ Marketing Strategies – segmentation, targeting &amp; positioning</li><li>✅ Product Management – product life cycle &amp; brand management</li></ul>',
    tags: ['Management', 'Marketing', 'BPharm', 'Semester 8'],
    formats: ['PDF Ebook', 'B&W Printed', 'Color Printed'],
  },
  {
    id: '3',
    title: 'Social & Preventive Pharmacy (B.Pharm 8th Sem)',
    shortTitle: 'Social & Preventive Pharmacy',
    subject: 'Public Health',
    semester: 8,
    year: 'Fourth Year',
    price: '₹49',
    image: 'https://cdn.shopify.com/s/files/1/1000/3998/3418/files/rn-image_picker_lib_temp_45cde050-16af-4f5b-9c58-9aef9bc70cdd.png?v=1779039055',
    rating: '4.8',
    pages: 150,
    checkoutUrl: 'https://tgpcop-pharma.myshopify.com/products/social-preventive-pharmacy-b-pharm-sem-8',
    descriptionHtml: '<p><strong>Comprehensive handwritten Social &amp; Preventive Pharmacy notes including public health, epidemiology, national health programs and preventive healthcare concepts.</strong></p><ul><li>✅ Public Health – concepts, determinants &amp; indicators</li><li>✅ Epidemiology – disease patterns, incidence &amp; prevalence</li><li>✅ National Health Programs – NHM, immunization &amp; TB control</li></ul>',
    tags: ['Public Health', 'Preventive Pharmacy', 'BPharm', 'Semester 8'],
    formats: ['PDF Ebook', 'B&W Printed', 'Color Printed'],
  },
  {
    id: '4',
    title: 'Biostatistics & Research Methodology (B.Pharm 8th Sem)',
    shortTitle: 'Biostatistics & Research Methodology',
    subject: 'Biostatistics',
    semester: 8,
    year: 'Fourth Year',
    price: '₹49',
    image: 'https://cdn.shopify.com/s/files/1/1000/3998/3418/files/WhatsAppImage2026-05-17at5.38.23PM.jpg?v=1779019728',
    rating: '4.8',
    pages: 150,
    checkoutUrl: 'https://tgpcop-pharma.myshopify.com/products/biostatistics-research-methodology-b-pharm-sem-8',
    descriptionHtml: '<p><strong>Easy handwritten Biostatistics &amp; Research Methodology notes covering sampling, probability, hypothesis testing and pharmaceutical research concepts.</strong></p><ul><li>✅ Sampling – types, methods &amp; sample size calculation</li><li>✅ Probability – distributions, normal &amp; binomial</li><li>✅ Hypothesis Testing – t-test, chi-square, ANOVA</li></ul>',
    tags: ['Biostatistics', 'Research Methodology', 'BPharm', 'Semester 8'],
    formats: ['PDF Ebook', 'B&W Printed', 'Color Printed'],
  },
];

// ─── Year Config ─────────────────────────────────────────────────────────────
const yearConfig = [
  { label: 'All', value: 'all', icon: '📚', color: 'from-purple-600 to-purple-800', semesters: [] },
  { label: 'First Year', value: 'First Year', icon: '🌱', color: 'from-emerald-600 to-emerald-800', semesters: ['Sem 1', 'Sem 2'] },
  { label: 'Second Year', value: 'Second Year', icon: '🔬', color: 'from-blue-600 to-blue-800', semesters: ['Sem 3', 'Sem 4'] },
  { label: 'Third Year', value: 'Third Year', icon: '⚗️', color: 'from-amber-600 to-amber-800', semesters: ['Sem 5', 'Sem 6'] },
  { label: 'Fourth Year', value: 'Fourth Year', icon: '🎓', color: 'from-rose-600 to-rose-800', semesters: ['Sem 7', 'Sem 8'] },
];

const formatIcons: Record<string, string> = {
  'PDF Ebook': '📄',
  'B&W Printed': '🖨️',
  'Color Printed': '🌈',
};

// ─── Main Component ───────────────────────────────────────────────────────────
export const StudyMaterial: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedNote, setSelectedNote] = useState<StudyNote | null>(null);

  const filteredNotes = useMemo(() => {
    return studyNotes.filter(note => {
      const matchesSearch =
        note.shortTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesYear = selectedYear === 'all' || note.year === selectedYear;
      return matchesSearch && matchesYear;
    });
  }, [searchQuery, selectedYear]);

  // Group by semester when a year is selected
  const groupedNotes = useMemo(() => {
    const groups: Record<number, StudyNote[]> = {};
    filteredNotes.forEach(note => {
      if (!groups[note.semester]) groups[note.semester] = [];
      groups[note.semester].push(note);
    });
    return groups;
  }, [filteredNotes]);

  const semesterKeys = Object.keys(groupedNotes)
    .map(Number)
    .sort((a, b) => a - b);

  const totalCount = filteredNotes.length;

  return (
    <div className="relative min-h-screen bg-[#050B18] overflow-hidden pb-24">
      {/* Science Canvas Background */}
      <ScienceBackground />

      {/* Page Header */}
      {!Capacitor.isNativePlatform() && (
        <PageHeader
          icon={<GraduationCap className="w-6 h-6 text-orange-burnt" />}
          title="Study Material"
          subtitle="Premium handwritten notes for every B.Pharm semester – crafted by TGPCOP NOTES for exam success."
          breadcrumb="Study Material"
        />
      )}

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 sm:mt-14">

        {/* ── Stats Banner ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
          {[
            { icon: <BookOpen className="w-5 h-5" />, value: `${studyNotes.length}+`, label: 'Study Notes' },
            { icon: <Layers className="w-5 h-5" />, value: '8', label: 'Semesters' },
            { icon: <Star className="w-5 h-5" />, value: '4.8★', label: 'Avg Rating' },
            { icon: <Download className="w-5 h-5" />, value: '3', label: 'Formats Available' },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-[#0D1B3E]/80 border border-orange-burnt/20 rounded-2xl p-4 flex items-center gap-3 backdrop-blur-sm"
            >
              <div className="w-9 h-9 rounded-xl bg-orange-burnt/15 flex items-center justify-center text-orange-burnt shrink-0">
                {stat.icon}
              </div>
              <div>
                <div className="font-display font-extrabold text-white text-lg leading-none">{stat.value}</div>
                <div className="text-white/50 text-[10px] font-semibold uppercase tracking-wider mt-0.5">{stat.label}</div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* ── Filters & Search ── */}
        <div className="flex flex-col gap-4 mb-10">
          {/* Year Filter Tabs */}
          <div className="flex flex-wrap gap-2">
            {yearConfig.map(yr => {
              const isActive = selectedYear === yr.value;
              return (
                <button
                  key={yr.value}
                  onClick={() => setSelectedYear(yr.value)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-display font-bold uppercase tracking-wider transition-all select-none ${
                    isActive
                      ? 'bg-gradient-to-r from-orange-burnt to-[#E06D2B] text-white shadow-lg shadow-orange-burnt/25'
                      : 'bg-[#0D1B3E]/70 text-white/60 hover:text-white hover:bg-[#0D1B3E] border border-orange-burnt/15 hover:border-orange-burnt/30'
                  }`}
                >
                  <span>{yr.icon}</span>
                  <span>{yr.label}</span>
                  {yr.value !== 'all' && (
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${isActive ? 'bg-white/20' : 'bg-white/10'}`}>
                      {studyNotes.filter(n => n.year === yr.value).length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Search Row */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-white/35" />
              <input
                type="text"
                placeholder="Search subjects, topics, keywords..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-[#060D1F] border border-orange-burnt/25 focus:border-orange-burnt rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder:text-white/30 outline-none transition-all focus:ring-1 focus:ring-orange-burnt/25"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-3.5 text-white/40 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="text-white/50 text-xs font-semibold shrink-0">
              <Filter className="w-3.5 h-3.5 inline mr-1" />
              {totalCount} result{totalCount !== 1 ? 's' : ''}
            </div>
          </div>
        </div>

        {/* ── Content ── */}
        {filteredNotes.length === 0 ? (
          <div className="text-center py-24 bg-[#0D1B3E]/60 rounded-3xl border border-orange-burnt/15">
            <BookMarked className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <h3 className="font-display font-bold text-white/70 text-xl">No notes found</h3>
            <p className="text-white/40 text-sm mt-2">Try a different search term or clear your filters.</p>
            <button
              onClick={() => { setSearchQuery(''); setSelectedYear('all'); }}
              className="mt-5 px-5 py-2.5 rounded-xl bg-orange-burnt/15 hover:bg-orange-burnt/25 border border-orange-burnt/30 text-orange-burnt text-xs font-bold uppercase tracking-wider transition-all"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="space-y-14">
            {semesterKeys.map((sem) => (
              <div key={sem}>
                {/* Semester Divider */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4 }}
                  className="flex items-center gap-4 mb-7"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-burnt to-[#E06D2B] flex items-center justify-center shadow-lg shadow-orange-burnt/25">
                      <span className="font-display font-extrabold text-white text-sm">{sem}</span>
                    </div>
                    <div>
                      <h2 className="font-display font-extrabold text-white text-xl leading-none">
                        Semester {sem}
                      </h2>
                      <p className="text-orange-burnt text-[10px] font-bold uppercase tracking-widest mt-0.5">
                        {groupedNotes[sem][0].year} • {groupedNotes[sem].length} Subject{groupedNotes[sem].length > 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex-1 h-px bg-gradient-to-r from-orange-burnt/30 to-transparent" />
                </motion.div>

                {/* Notes Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {groupedNotes[sem].map((note, idx) => (
                    <NoteCard
                      key={note.id}
                      note={note}
                      delay={idx * 0.07}
                      onClick={() => setSelectedNote(note)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Footer CTA ── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-20 text-center py-12 bg-gradient-to-b from-[#0D1B3E]/80 to-[#050B18]/80 rounded-3xl border border-orange-burnt/15 backdrop-blur-sm"
        >
          <GraduationCap className="w-12 h-12 text-orange-burnt mx-auto mb-4" />
          <h3 className="font-display font-extrabold text-white text-2xl mb-2">
            TGPCOP NOTES — Learn • Grow • Succeed
          </h3>
          <p className="text-white/55 text-sm max-w-lg mx-auto mb-7">
            All notes are handwritten by TGPCOP students, reviewed by faculty, and designed to help you ace every semester exam.
          </p>
          <a
            href="https://tgpcop-pharma.myshopify.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-gradient-to-r from-orange-burnt to-[#E06D2B] text-white font-display font-bold text-sm uppercase tracking-widest shadow-lg shadow-orange-burnt/25 hover:shadow-orange-burnt/40 transition-all active:scale-95"
          >
            <ExternalLink className="w-4 h-4" />
            Visit Full Store
          </a>
        </motion.div>
      </div>

      {/* ── Detail Modal ── */}
      <AnimatePresence>
        {selectedNote && (
          <NoteModal note={selectedNote} onClose={() => setSelectedNote(null)} />
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── Note Card ────────────────────────────────────────────────────────────────
interface NoteCardProps {
  note: StudyNote;
  delay: number;
  onClick: () => void;
}
const NoteCard: React.FC<NoteCardProps> = ({ note, delay, onClick }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.45, delay }}
    whileHover={{ y: -6, boxShadow: '0 18px 40px -12px rgba(214,90,30,0.30)' }}
    onClick={onClick}
    className="bg-[#0D1B3E]/85 border border-orange-burnt/20 rounded-2xl overflow-hidden flex flex-col cursor-pointer group transition-all duration-300 h-full"
  >
    {/* Cover Image */}
    <div className="relative h-44 overflow-hidden bg-[#050B18] border-b border-orange-burnt/10">
      <img
        src={note.image}
        alt={note.shortTitle}
        className="w-full h-full object-contain p-3 bg-white/5 transition-transform duration-500 group-hover:scale-105"
        loading="lazy"
        decoding="async"
      />
      {/* Overlay */}
      <div className="absolute inset-0 bg-[#050B18]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      {/* Sem pill */}
      <span className="absolute top-3 left-3 bg-gradient-to-r from-[#F5A623] to-[#E09D2B] text-navy-dark text-[9px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full shadow-md">
        Sem {note.semester}
      </span>
      {/* Price */}
      <span className="absolute bottom-3 right-3 bg-orange-burnt text-white text-xs font-extrabold px-2.5 py-1 rounded-lg shadow-md font-display">
        {note.price}
      </span>
    </div>

    {/* Content */}
    <div className="p-4 flex flex-col flex-1 gap-2">
      <span className="text-[9px] font-bold uppercase tracking-widest text-[#F5A623]">
        {note.subject}
      </span>
      <h3 className="font-display font-bold text-white text-sm group-hover:text-orange-burnt transition-colors line-clamp-2 leading-snug flex-1">
        {note.shortTitle}
      </h3>
      <div className="flex items-center gap-3 text-[10px] text-white/45 mt-1">
        <span>📖 {note.pages} pages</span>
        <span>⭐ {note.rating}</span>
      </div>
      {/* Format pills */}
      <div className="flex flex-wrap gap-1.5 mt-1">
        {note.formats.map(fmt => (
          <span
            key={fmt}
            className="text-[9px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/50 font-semibold"
          >
            {formatIcons[fmt]} {fmt}
          </span>
        ))}
      </div>
    </div>

    {/* CTA */}
    <div className="px-4 pb-4">
      <div className="w-full py-2.5 bg-[#060D1F] hover:bg-gradient-to-r hover:from-orange-burnt hover:to-[#E06D2B] border border-orange-burnt/30 hover:border-transparent text-white font-display font-bold text-[10px] uppercase tracking-widest rounded-xl transition-all duration-300 flex items-center justify-center gap-1.5">
        <BookOpen className="w-3.5 h-3.5" />
        <span>View Details</span>
        <ChevronRight className="w-3 h-3" />
      </div>
    </div>
  </motion.div>
);

// ─── Note Detail Modal ────────────────────────────────────────────────────────
interface NoteModalProps {
  note: StudyNote;
  onClose: () => void;
}
const NoteModal: React.FC<NoteModalProps> = ({ note, onClose }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm"
    onClick={onClose}
  >
    <motion.div
      initial={{ scale: 0.94, opacity: 0, y: 18 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0.94, opacity: 0, y: 18 }}
      transition={{ type: 'spring', stiffness: 320, damping: 26 }}
      onClick={e => e.stopPropagation()}
      className="relative w-full max-w-3xl max-h-[92vh] bg-[#050B18] border border-orange-burnt/30 rounded-2xl shadow-2xl overflow-y-auto flex flex-col md:flex-row"
    >
      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 p-2 bg-black/60 hover:bg-orange-burnt text-white rounded-full backdrop-blur-md transition-colors"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Image */}
      <div className="w-full md:w-2/5 bg-white/5 border-b md:border-b-0 md:border-r border-orange-burnt/20 p-6 flex flex-col items-center justify-center min-h-[260px]">
        <img src={note.image} alt={note.shortTitle} className="w-full max-h-[360px] object-contain drop-shadow-2xl" />
        <div className="flex flex-wrap gap-2 mt-4 justify-center">
          {note.formats.map(fmt => (
            <span
              key={fmt}
              className="text-[10px] px-2.5 py-1 rounded-full bg-orange-burnt/10 border border-orange-burnt/25 text-orange-burnt font-bold"
            >
              {formatIcons[fmt]} {fmt}
            </span>
          ))}
        </div>
      </div>

      {/* Details */}
      <div className="w-full md:w-3/5 p-6 sm:p-8 flex flex-col">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[#F5A623] mb-2">
          {note.subject} • Semester {note.semester} • {note.year}
        </span>
        <h2 className="font-display font-bold text-white text-xl sm:text-2xl leading-tight mb-4">
          {note.shortTitle}
        </h2>

        <div className="flex items-center gap-5 text-xs text-white/60 mb-5 pb-5 border-b border-white/10">
          <span>📖 {note.pages} pages</span>
          <span>⭐ {note.rating} Rating</span>
          <span className="text-orange-burnt font-extrabold text-base font-display">{note.price}</span>
        </div>

        {/* Description */}
        <div
          className="prose prose-invert prose-sm max-w-none text-white/75 overflow-y-auto pr-2 flex-1 space-y-3 [&_li]:text-white/70 [&_strong]:text-white"
          dangerouslySetInnerHTML={{ __html: note.descriptionHtml }}
        />

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mt-5">
          {note.tags.map(tag => (
            <span key={tag} className="text-[9px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/45">
              <Tag className="w-2.5 h-2.5 inline mr-0.5" />{tag}
            </span>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-6 pt-5 border-t border-white/10 flex flex-col gap-2">
          <a
            href={note.checkoutUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3.5 bg-gradient-to-r from-orange-burnt to-[#E06D2B] hover:shadow-lg hover:shadow-orange-burnt/30 text-white font-display text-sm font-bold uppercase tracking-widest rounded-xl transition-all duration-300 active:scale-95 flex items-center justify-center gap-2"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Buy Now — {note.price}</span>
          </a>
          <a
            href="https://tgpcop-pharma.myshopify.com"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white font-display text-xs font-bold uppercase tracking-widest rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            View on TGPCOP Pharma Store
          </a>
        </div>
      </div>
    </motion.div>
  </motion.div>
);

export default StudyMaterial;
