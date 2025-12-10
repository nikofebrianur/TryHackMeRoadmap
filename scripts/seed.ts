import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const envPath = path.join(__dirname, '..', '.env')
const envContent = fs.readFileSync(envPath, 'utf-8')
const envVars: { [key: string]: string } = {}

envContent.split('\n').forEach((line) => {
  const match = line.match(/^([^=]+)=(.*)$/)
  if (match) {
    envVars[match[1].trim()] = match[2].trim()
  }
})

const supabaseUrl = envVars.VITE_SUPABASE_URL || ''
const supabaseKey = envVars.VITE_SUPABASE_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env file')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

type CategoryData = {
  name: string
  display_order: number
  rooms: Array<{
    title: string
    url: string
    display_order: number
  }>
}

function parseReadme(content: string): CategoryData[] {
  const categories: CategoryData[] = []
  const lines = content.split('\n')

  let currentCategory: CategoryData | null = null
  let displayOrder = 0
  let roomOrder = 0

  const categoryMap: { [key: string]: string } = {
    'Intro Rooms': 'Introductory Rooms',
    'Linux Fundamentals': 'Linux Fundamentals',
    'Windows Fundamentals': 'Windows Fundamentals',
    'Basics Rooms': 'Basic Rooms',
    'Recon': 'Reconnaissance',
    'Scripting': 'Scripting',
    'Networking': 'Networking',
    'Tooling': 'Tooling',
    'Crypto & Hashes': 'Crypto & Hashes',
    'Steganography': 'Steganography',
    'Web': 'Web',
    'Android': 'Android',
    'Forensics': 'Forensics',
    'Wi-Fi Hacking': 'Wifi Hacking',
    'Reverse Engineering': 'Reverse Engineering',
    'Malware Analysis': 'Malware Analysis',
    'PrivEsc': 'Privilege Escalation',
    'Windows': 'Windows',
    'Active Directory': 'Active Directory',
    'PCAP Analysis': 'PCAP Analysis',
    'BufferOverflow': 'Buffer Overflow',
    'Easy CTF': 'Easy CTF',
    'Medium CTF': 'Medium CTF',
    'Hard CTF': 'Hard CTF',
    'Misc': 'Misc',
    'Special Events': 'Special Events',
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()

    const categoryMatch = line.match(/^##\s+(.+)$/)
    if (categoryMatch) {
      const categoryName = categoryMatch[1]
      const mappedName = categoryMap[categoryName] || categoryName

      if (currentCategory) {
        categories.push(currentCategory)
      }

      displayOrder++
      roomOrder = 0
      currentCategory = {
        name: mappedName,
        display_order: displayOrder,
        rooms: [],
      }
      continue
    }

    const roomMatch = line.match(/^-\s+\[\s*\]\s+\[(.+?)\]\((.+?)\)/)
    if (roomMatch && currentCategory) {
      roomOrder++
      const title = roomMatch[1].replace('TryHackMe | ', '')
      const url = roomMatch[2]

      currentCategory.rooms.push({
        title,
        url,
        display_order: roomOrder,
      })
    }
  }

  if (currentCategory) {
    categories.push(currentCategory)
  }

  return categories
}

async function seedDatabase() {
  try {
    console.log('Reading README.md...')
    const readmePath = path.join(process.cwd(), 'README.md')
    const readmeContent = fs.readFileSync(readmePath, 'utf-8')

    console.log('Parsing categories and rooms...')
    const categories = parseReadme(readmeContent)

    console.log(`Found ${categories.length} categories`)

    console.log('Clearing existing data...')
    await supabase.from('user_progress').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('rooms').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('categories').delete().neq('id', '00000000-0000-0000-0000-000000000000')

    console.log('Seeding categories...')
    for (const category of categories) {
      const { data: categoryData, error: categoryError } = await supabase
        .from('categories')
        .insert({
          name: category.name,
          display_order: category.display_order,
          total_rooms: category.rooms.length,
        })
        .select()
        .single()

      if (categoryError) {
        console.error(`Error inserting category ${category.name}:`, categoryError)
        continue
      }

      console.log(`Seeding ${category.rooms.length} rooms for ${category.name}...`)

      for (const room of category.rooms) {
        const { error: roomError } = await supabase.from('rooms').insert({
          title: room.title,
          url: room.url,
          category_id: categoryData.id,
          display_order: room.display_order,
        })

        if (roomError) {
          console.error(`Error inserting room ${room.title}:`, roomError)
        }
      }
    }

    console.log('Database seeded successfully!')
    console.log(`Total categories: ${categories.length}`)
    console.log(`Total rooms: ${categories.reduce((sum, cat) => sum + cat.rooms.length, 0)}`)
  } catch (error) {
    console.error('Error seeding database:', error)
    process.exit(1)
  }
}

seedDatabase()
