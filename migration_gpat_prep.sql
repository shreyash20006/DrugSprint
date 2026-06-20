-- Migration: Create gpat_prep schema and tables with Semester support

-- 1. Create GPAT Questions Table
CREATE TABLE IF NOT EXISTS public.gpat_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  options TEXT[] NOT NULL,
  correct_option INTEGER NOT NULL,
  explanation TEXT,
  subject TEXT NOT NULL,
  semester TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create GPAT Flashcards Table
CREATE TABLE IF NOT EXISTS public.gpat_flashcards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  front TEXT NOT NULL,
  back TEXT NOT NULL,
  category TEXT NOT NULL,
  subject TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Create GPAT Scores Table (Leaderboard tracking)
CREATE TABLE IF NOT EXISTS public.gpat_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  student_name TEXT NOT NULL,
  student_email TEXT NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  quizzes_taken INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.gpat_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gpat_flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gpat_scores ENABLE ROW LEVEL SECURITY;

-- 5. Create Policies
-- A. Questions RLS
DROP POLICY IF EXISTS "Allow authenticated read gpat_questions" ON public.gpat_questions;
CREATE POLICY "Allow authenticated read gpat_questions"
  ON public.gpat_questions FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Allow admin modify gpat_questions" ON public.gpat_questions;
CREATE POLICY "Allow admin modify gpat_questions"
  ON public.gpat_questions FOR ALL TO authenticated
  USING (public.get_my_role() IN ('super_admin', 'admin', 'developer'));

-- B. Flashcards RLS
DROP POLICY IF EXISTS "Allow authenticated read gpat_flashcards" ON public.gpat_flashcards;
CREATE POLICY "Allow authenticated read gpat_flashcards"
  ON public.gpat_flashcards FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Allow admin modify gpat_flashcards" ON public.gpat_flashcards;
CREATE POLICY "Allow admin modify gpat_flashcards"
  ON public.gpat_flashcards FOR ALL TO authenticated
  USING (public.get_my_role() IN ('super_admin', 'admin', 'developer'));

-- C. Scores RLS
DROP POLICY IF EXISTS "Allow authenticated read gpat_scores" ON public.gpat_scores;
CREATE POLICY "Allow authenticated read gpat_scores"
  ON public.gpat_scores FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Allow students update own score" ON public.gpat_scores;
CREATE POLICY "Allow students update own score"
  ON public.gpat_scores FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- 6. Seed GPAT Prep Questions with Semester Tags
INSERT INTO public.gpat_questions (question, options, correct_option, explanation, subject, semester) VALUES
(
  'Which of the following is a loop diuretic?',
  ARRAY['Furosemide', 'Hydrochlorothiazide', 'Spironolactone', 'Acetazolamide'],
  0,
  'Furosemide is a loop diuretic that inhibits the Na+/K+/2Cl- symporter in the thick ascending limb of the loop of Henle.',
  'Pharmacology',
  'Semester V'
),
(
  'Which equation describes the rate of drug dissolution from a tablet?',
  ARRAY['Noyes-Whitney Equation', 'Henderson-Hasselbalch Equation', 'Arrhenius Equation', 'Michaelis-Menten Equation'],
  0,
  'The Noyes-Whitney equation describes the rate of dissolution: dC/dt = DA/h * (Cs - Cb).',
  'Pharmaceutics',
  'Semester VI'
),
(
  'Which family does the medicinal plant Atropa belladonna belong to?',
  ARRAY['Solanaceae', 'Lamiaceae', 'Fabaceae', 'Asteraceae'],
  0,
  'Atropa belladonna (deadly nightshade) belongs to the Solanaceae family and is a source of tropane alkaloids like atropine.',
  'Pharmacognosy',
  'Semester IV'
),
(
  'Which of the following is an example of an ester-type local anesthetic?',
  ARRAY['Procaine', 'Lidocaine', 'Prilocaine', 'Bupivacaine'],
  0,
  'Procaine is an ester-type local anesthetic. Lidocaine, prilocaine, and bupivacaine are amide-type local anesthetics (which typically have an "i" in the prefix before "caine").',
  'Pharmaceutical Chemistry',
  'Semester IV'
),
(
  'Which receptor sub-type does Propranolol block?',
  ARRAY['Both Beta-1 and Beta-2', 'Only Beta-1', 'Only Beta-2', 'Alpha-1'],
  0,
  'Propranolol is a non-selective beta-blocker that acts on both beta-1 (cardiac) and beta-2 (bronchial/vascular) adrenergic receptors.',
  'Pharmacology',
  'Semester V'
),
(
  'What is the primary mechanism of action of Aspirin?',
  ARRAY['Irreversible inhibition of COX', 'Reversible inhibition of COX', 'Activation of Lipoxygenase', 'Direct block of thromboxane receptors'],
  0,
  'Aspirin irreversibly acetylates serine residues of Cyclooxygenase (COX-1 and COX-2) enzymes, preventing prostaglandin synthesis.',
  'Pharmacology',
  'Semester V'
),
(
  'What does HLB stand for in surfactant chemistry?',
  ARRAY['Hydrophilic-Lipophilic Balance', 'Hydrophobic-Lipophilic Bond', 'Hydro-Lipid Buffer', 'High Lipophilic Balance'],
  0,
  'HLB stands for Hydrophilic-Lipophilic Balance. It is an empirical measure of the relationship of the hydrophilic and lipophilic groups of a surfactant.',
  'Pharmaceutics',
  'Semester IV'
),
(
  'Which alkaloid is derived from Cinchona bark?',
  ARRAY['Quinine', 'Reserpine', 'Morphine', 'Atropine'],
  0,
  'Quinine is a quinoline alkaloid obtained from Cinchona bark (Cinchona officinalis), used historically as an antimalarial drug.',
  'Pharmacognosy',
  'Semester V'
),
(
  'What is the chemical class of Ibuprofen?',
  ARRAY['Propionic acid derivative', 'Salicylic acid derivative', 'Indole derivative', 'Pyrazolone derivative'],
  0,
  'Ibuprofen is a propionic acid derivative (2-(4-isobutylphenyl)propanoic acid), belonging to the class of non-steroidal anti-inflammatory drugs (NSAIDs).',
  'Pharmaceutical Chemistry',
  'Semester IV'
),
(
  'Which of the following is the antidote for Paracetamol (Acetaminophen) poisoning?',
  ARRAY['N-acetylcysteine', 'Naloxone', 'Flumazenil', 'Atropine'],
  0,
  'N-acetylcysteine (NAC) acts as an antidote for Paracetamol overdose by restoring glutathione levels in the liver, helping to detoxify the toxic metabolite NAPQI.',
  'Pharmacology',
  'Semester V'
)
ON CONFLICT DO NOTHING;


-- 7. Seed GPAT Flashcards
INSERT INTO public.gpat_flashcards (front, back, category, subject) VALUES
(
  'Metformin',
  'Class: Biguanide. Mechanism: Decreases hepatic glucose production, decreases intestinal absorption of glucose, and improves insulin sensitivity. Primary use: Type 2 Diabetes.',
  'Drug Classes',
  'Pharmacology'
),
(
  'Atorvastatin',
  'Class: HMG-CoA Reductase Inhibitor (Statins). Mechanism: Inhibits HMG-CoA reductase, the rate-limiting enzyme in cholesterol synthesis, leading to up-regulation of hepatic LDL receptors. Primary use: Hypercholesterolemia.',
  'Drug Classes',
  'Pharmacology'
),
(
  'Penicillin G',
  'Class: Beta-lactam Antibiotic. Mechanism: Inhibits bacterial cell wall synthesis by binding to penicillin-binding proteins (PBPs) and preventing cross-linking of peptidoglycan, causing osmotic lysis. Primary use: Gram-positive bacterial infections.',
  'Mechanism of Action',
  'Pharmacology'
),
(
  'Propranolol',
  'Class: Non-selective Beta-adrenergic Blocker. Mechanism: Antagonizes both Beta-1 (cardiac) and Beta-2 (bronchial/vascular smooth muscle) adrenergic receptors. Primary use: Hypertension, angina, migraine prophylaxis.',
  'Drug Classes',
  'Pharmacology'
),
(
  'Morphine',
  'Class: Opioid Analgesic. Mechanism: Agonist at mu-opioid receptors in the central nervous system, altering the perception and emotional response to pain. Primary use: Severe pain.',
  'Receptor Targets',
  'Pharmacology'
),
(
  'Amlodipine',
  'Class: Dihydropyridine Calcium Channel Blocker. Mechanism: Inhibits calcium ion influx across cell membranes in vascular smooth muscle and cardiac muscle, leading to systemic vasodilation and decreased blood pressure. Primary use: Hypertension, angina.',
  'Drug Classes',
  'Pharmacology'
),
(
  'Omeprazole',
  'Class: Proton Pump Inhibitor (PPI). Mechanism: Irreversibly binds to H+/K+ ATPase enzyme system (proton pump) of gastric parietal cells, suppressing base and stimulated acid secretion. Primary use: GERD, peptic ulcers.',
  'Mechanism of Action',
  'Pharmacology'
),
(
  'Salbutamol (Albuterol)',
  'Class: Short-acting Beta-2 Adrenergic Agonist (SABA). Mechanism: Relaxes bronchial smooth muscle by stimulating beta-2 receptors, causing rapid bronchodilation. Primary use: Acute asthma attacks, COPD bronchospasm.',
  'Receptor Targets',
  'Pharmacology'
),
(
  'Warfarin',
  'Class: Vitamin K Antagonist (Anticoagulant). Mechanism: Inhibits vitamin K epoxide reductase, preventing conversion of oxidized vitamin K back to its active reduced form, depleting factors II, VII, IX, and X. Primary use: Prevention of thrombosis.',
  'Mechanism of Action',
  'Pharmacology'
),
(
  'Ranitidine',
  'Class: H2-receptor Antagonist. Mechanism: Reversibly inhibits histamine action at H2-receptors on gastric parietal cells, reducing gastric volume and acid concentration. Primary use: Acid reflux, heartburn.',
  'Receptor Targets',
  'Pharmacology'
)
ON CONFLICT DO NOTHING;
