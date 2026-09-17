export const symptomOptions = [
  { id: 'fever', label: 'Fever' },
  { id: 'cough', label: 'Cough' },
  { id: 'runny-nose', label: 'Runny or blocked nose' },
  { id: 'sore-throat', label: 'Sore throat' },
  { id: 'headache', label: 'Headache' },
  { id: 'body-aches', label: 'Body aches' },
  { id: 'fatigue', label: 'Fatigue' },
  { id: 'sneezing', label: 'Sneezing or itchy eyes' },
  { id: 'nausea', label: 'Nausea or vomiting' },
  { id: 'diarrhea', label: 'Diarrhea' },
  { id: 'stomach-pain', label: 'Stomach pain' },
  { id: 'rash', label: 'Rash' },
]

export const redFlagOptions = [
  { id: 'trouble-breathing', label: 'Trouble breathing or shortness of breath' },
  { id: 'chest-pain', label: 'Chest pain, pressure, or tightness' },
  { id: 'confusion', label: 'New confusion, fainting, or difficulty staying awake' },
  { id: 'blue-lips', label: 'Blue, grey, or unusually pale lips or skin' },
  { id: 'severe-dehydration', label: 'Unable to keep fluids down or very little urination' },
  { id: 'severe-allergic-reaction', label: 'Swelling of the face or tongue' },
]

export const conditionRules = [
  {
    id: 'common-cold',
    name: 'Common cold',
    summary: 'A mild viral upper-respiratory illness is possible based on the symptoms selected.',
    symptoms: ['runny-nose', 'sneezing', 'sore-throat', 'cough'],
    minimumMatches: 2,
    care: ['Rest and drink plenty of fluids.', 'Use warm liquids or a salt-water gargle for throat comfort.', 'Monitor symptoms and seek care if they worsen or last longer than expected.'],
    otc: { name: 'Paracetamol (acetaminophen)', guidance: 'May help pain or fever when used exactly as the package directs.', warnings: 'Do not combine products containing paracetamol. Ask a pharmacist first if you have liver disease or drink heavily.' },
  },
  {
    id: 'flu-like-illness',
    name: 'Flu-like viral illness',
    summary: 'A viral illness such as influenza is possible; testing may be needed to tell conditions apart.',
    symptoms: ['fever', 'cough', 'body-aches', 'fatigue', 'headache'],
    minimumMatches: 2,
    care: ['Rest, drink fluids, and limit close contact while feverish.', 'Track temperature and breathing.', 'Contact a clinician promptly if symptoms are severe, rapidly worsening, or you are in a high-risk group.'],
    otc: { name: 'Paracetamol (acetaminophen)', guidance: 'May help pain or fever when used exactly as the package directs.', warnings: 'Do not combine products containing paracetamol. It does not treat the virus and antibiotics are not routine treatment for viral illness.' },
  },
  {
    id: 'tension-headache',
    name: 'Tension-type headache',
    summary: 'The pattern may fit a tension-type headache, especially when discomfort is mild and pressure-like.',
    symptoms: ['headache', 'fatigue'],
    minimumMatches: 1,
    care: ['Rest in a quiet space and drink water.', 'Try a cool or warm compress and a regular sleep routine.', 'Arrange medical advice for a new, persistent, or recurring headache.'],
    otc: { name: 'Paracetamol (acetaminophen)', guidance: 'May help occasional headache when used exactly as the package directs.', warnings: 'Avoid frequent use without medical advice. Seek urgent care for a sudden severe headache or headache with confusion, weakness, or vision changes.' },
  },
  {
    id: 'allergic-rhinitis',
    name: 'Allergic rhinitis',
    summary: 'Allergies may be contributing, particularly with sneezing, itchy eyes, or a runny nose without fever.',
    symptoms: ['sneezing', 'runny-nose'],
    minimumMatches: 2,
    care: ['Reduce exposure to suspected triggers and rinse your face after being outdoors.', 'Keep windows closed when outdoor allergens are high.', 'Speak with a pharmacist if symptoms continue or affect sleep.'],
    otc: { name: 'Non-drowsy antihistamine', guidance: 'A pharmacist can help select an age-appropriate product and explain the label directions.', warnings: 'Some antihistamines cause drowsiness. Check interactions and avoid combining cold medicines without pharmacist advice.' },
  },
  {
    id: 'gastroenteritis',
    name: 'Stomach infection or irritation',
    summary: 'A short-term stomach illness is possible with nausea, diarrhea, or stomach pain.',
    symptoms: ['nausea', 'diarrhea', 'stomach-pain'],
    minimumMatches: 2,
    care: ['Take small, frequent sips of water or oral rehydration solution.', 'Choose light foods as tolerated and rest.', 'Seek medical advice for blood in stool, severe pain, persistent vomiting, or worsening symptoms.'],
    otc: { name: 'Oral rehydration solution', guidance: 'Use a correctly prepared pharmacy oral rehydration product to replace fluids and salts.', warnings: 'Do not use anti-diarrheal medicine for children without medical advice. Seek care early for infants, older adults, or people with chronic illness.' },
  },
]

export function getPossibleConditions(selectedSymptoms) {
  return conditionRules
    .map((rule) => {
      const matches = rule.symptoms.filter((symptom) => selectedSymptoms.includes(symptom))
      return { ...rule, matches, score: matches.length / rule.symptoms.length }
    })
    .filter((rule) => rule.matches.length >= rule.minimumMatches)
    .sort((a, b) => b.matches.length - a.matches.length || b.score - a.score)
    .slice(0, 3)
}
