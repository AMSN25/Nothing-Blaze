export interface Mood {
  index: string
  title: string[]
  note: string
  genres: number[]
  href: string
}

export const MOODS: Mood[] = [
  {
    index: '01',
    title: ['Action', '& Thrills'],
    note: '1,204 titles',
    genres: [28, 10759],
    href: '/films?genre=28',
  },
  {
    index: '02',
    title: ['Science', 'Fiction'],
    note: '862 titles',
    genres: [878, 10765],
    href: '/films?genre=878',
  },
  {
    index: '03',
    title: ['Drama', '& Character'],
    note: '2,417 titles',
    genres: [18],
    href: '/films?genre=18',
  },
  {
    index: '04',
    title: ['Animation', '& Form'],
    note: '739 titles',
    genres: [16],
    href: '/films?genre=16',
  },
]
