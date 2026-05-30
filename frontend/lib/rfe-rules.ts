import type { CriterionType } from './types'

export type RFELevel = 'high' | 'moderate'

export type RFEFlag = {
  criterion: CriterionType
  level: RFELevel
  flag: string
  detail: string
  fix: string
}

type EvidenceLike = {
  url: string | null
  score: number | null
  title: string
  description: string | null
}

export function getRFEFlags(
  criterion: CriterionType,
  evidence: EvidenceLike[],
  avgScore: number
): RFEFlag[] {
  const flags: RFEFlag[] = []
  const count = evidence.length
  const withUrl = evidence.filter(e => e.url).length
  const scored = evidence.filter(e => e.score != null)

  switch (criterion) {
    case 'press':
      if (count === 0) {
        flags.push({
          criterion, level: 'high',
          flag: 'No press coverage documented',
          detail: 'USCIS requires evidence of published material about you in professional or major trade publications.',
          fix: 'Add press mentions, interviews, or articles featuring your work.',
        })
      } else if (withUrl === 0) {
        flags.push({
          criterion, level: 'high',
          flag: 'No source links — all press lacks external verification',
          detail: 'Every press item should have a direct URL to the article. USCIS officers verify source credibility and publication date.',
          fix: 'Add a URL to each press item pointing to the original publication.',
        })
      } else if (avgScore > 0 && avgScore < 40) {
        flags.push({
          criterion, level: 'moderate',
          flag: 'Press sources may not meet major publication threshold',
          detail: 'USCIS frequently RFEs on self-authored articles, company blogs, and unknown publications. Strong press = TechCrunch, Wired, MIT Tech Review, NYT.',
          fix: 'Aim to get coverage in nationally recognized outlets, not just company or personal blogs.',
        })
      }
      break

    case 'judging':
      if (count === 0) {
        flags.push({
          criterion, level: 'high',
          flag: 'No judging roles documented',
          detail: 'This criterion requires peer review or judging roles at recognized venues.',
          fix: 'Add reviewer or program committee roles at top-tier conferences (NeurIPS, ICML, Nature, etc.).',
        })
      } else if (avgScore > 0 && avgScore < 40) {
        flags.push({
          criterion, level: 'moderate',
          flag: 'Judging roles may not meet top-tier venue threshold',
          detail: 'Workshop reviews and student competition judging are often RFE\'d. USCIS looks for established, selective venues.',
          fix: 'Add reviewer roles at premier conferences or high-impact journals.',
        })
      }
      break

    case 'high_salary':
      if (count === 0) {
        flags.push({
          criterion, level: 'high',
          flag: 'No salary documentation',
          detail: 'This criterion requires proof of remuneration substantially above peers.',
          fix: 'Add pay stubs, offer letters, and a third-party salary benchmark (Levels.fyi, Radford, or a compensation expert letter).',
        })
      } else if (withUrl === 0) {
        flags.push({
          criterion, level: 'high',
          flag: 'No external salary benchmark linked',
          detail: 'Pay stubs alone are frequently RFE\'d. USCIS expects a third-party benchmarking source showing you are in the top 10–15% for your role.',
          fix: 'Link to a Levels.fyi data page, Radford survey excerpt, or compensation consultant letter.',
        })
      }
      break

    case 'original_contributions':
      if (count === 0) {
        flags.push({
          criterion, level: 'high',
          flag: 'No original contributions documented',
          detail: 'USCIS requires evidence of original contributions of major significance to the field.',
          fix: 'Add patents, high-citation papers, widely adopted open-source work, or foundational methods.',
        })
      } else if (withUrl === 0) {
        flags.push({
          criterion, level: 'moderate',
          flag: 'No external links — impact is not independently verifiable',
          detail: 'Patent filings, GitHub repos with star counts, and published papers should all have direct links for the officer to verify.',
          fix: 'Add URLs to each contribution (patent application, GitHub, DOI/paper link).',
        })
      } else if (avgScore > 0 && avgScore < 40) {
        flags.push({
          criterion, level: 'moderate',
          flag: 'Contributions may not demonstrate major field significance',
          detail: 'USCIS requires contributions that influenced others — citations, adoptions, or recognized industry impact.',
          fix: 'Document citation counts, downstream usage, or expert letters acknowledging the work\'s impact.',
        })
      }
      break

    case 'scholarly_articles':
      if (count < 2) {
        flags.push({
          criterion, level: 'high',
          flag: count === 0 ? 'No publications documented' : 'Only 1 publication — USCIS expects multiple',
          detail: 'A single publication rarely satisfies this criterion. USCIS looks for a body of work with measurable impact.',
          fix: 'Add all peer-reviewed publications. Even preprints at top venues (arXiv NeurIPS) can be included.',
        })
      } else if (withUrl === 0) {
        flags.push({
          criterion, level: 'moderate',
          flag: 'No paper links — venue and citation data unverifiable',
          detail: 'Without DOI or URL links, officers cannot verify the publication venue or citation count.',
          fix: 'Add a link (DOI, conference URL, or Google Scholar) for each publication.',
        })
      }
      break

    case 'awards':
      if (count === 0) {
        flags.push({
          criterion, level: 'high',
          flag: 'No awards documented',
          detail: 'This criterion requires nationally or internationally recognized prizes or awards for excellence.',
          fix: 'Add awards from professional organizations, Forbes lists, IEEE/ACM recognition, or competitive grants.',
        })
      } else if (avgScore > 0 && avgScore < 40) {
        flags.push({
          criterion, level: 'moderate',
          flag: 'Awards may not meet national/international recognition threshold',
          detail: 'Internal company awards and local recognition are frequently dismissed. USCIS looks for industry-wide or field-wide recognition.',
          fix: 'Supplement with external nominations and apply to nationally recognized award programs.',
        })
      }
      break

    case 'memberships':
      if (count === 0) {
        flags.push({
          criterion, level: 'high',
          flag: 'No qualifying memberships documented',
          detail: 'This criterion requires membership in associations that require outstanding achievements as a condition of admission.',
          fix: 'Add IEEE Senior Member, ACM Senior Member, invitation-only advisory councils, or competitive fellowship programs.',
        })
      } else if (avgScore > 0 && avgScore < 40) {
        flags.push({
          criterion, level: 'moderate',
          flag: 'Memberships may not require outstanding achievement for admission',
          detail: 'Standard professional memberships (paying dues) do not qualify. USCIS requires selective admission based on excellence.',
          fix: 'Apply to IEEE/ACM senior grades or invitation-only professional bodies in your field.',
        })
      }
      break

    case 'critical_role':
      if (count === 0) {
        flags.push({
          criterion, level: 'high',
          flag: 'No critical role documentation',
          detail: 'You must demonstrate a critical or essential role in a distinguished organization.',
          fix: 'Add evidence: org chart showing scope, official letter from company on letterhead, examples of decisions and their impact.',
        })
      } else if (withUrl === 0 && count < 2) {
        flags.push({
          criterion, level: 'moderate',
          flag: 'Single undocumented claim — needs corroborating evidence',
          detail: 'USCIS requires multiple forms of documentation for critical role claims.',
          fix: 'Add an official employer letter, org chart, press about the organization, and metrics showing your scope of impact.',
        })
      }
      break

    case 'artistic_exhibitions':
      if (count === 0) {
        flags.push({
          criterion, level: 'high',
          flag: 'No exhibitions documented',
          detail: 'This criterion requires display of work at artistic exhibitions or showcases.',
          fix: 'Document exhibitions with catalog entries, press coverage, and venue information.',
        })
      }
      break

    case 'commercial_success':
      if (count === 0) {
        flags.push({
          criterion, level: 'high',
          flag: 'No commercial success documented',
          detail: 'This criterion requires commercial successes in your field — revenue, wide adoption, or measurable business impact.',
          fix: 'Add revenue figures, download/usage metrics, or a signed letter attributing commercial impact to your work.',
        })
      } else if (withUrl === 0) {
        flags.push({
          criterion, level: 'moderate',
          flag: 'No external metrics linked',
          detail: 'Commercial success claims need independent verification: app store metrics, company financials, or third-party usage data.',
          fix: 'Link to public metrics (App Store page, npm download stats, press about product revenue).',
        })
      }
      break
  }

  return flags
}
