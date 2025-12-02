import { useRouter } from 'next/router'
import Link from 'next/link'

import { YamlGenerator } from '@/components/YamlGenerator'
import { Prose } from '@/components/Prose'

function TableOfContents({ tableOfContents }) {
  return (
    <nav className="sticky top-8 max-h-[calc(100vh-4rem)] overflow-y-auto">
      <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">
        On this page
      </h2>
      <ul className="space-y-2 text-sm">
        {tableOfContents.map((section) => (
          <li key={section.id}>
            <a
              href={`#${section.id}`}
              className="block text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors"
            >
              {section.title}
            </a>
            {section.children.length > 0 && (
              <ul className="mt-2 ml-4 space-y-2">
                {section.children.map((child) => (
                  <li key={child.id}>
                    <a
                      href={`#${child.id}`}
                      className="block text-gray-500 hover:text-gray-700 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
                    >
                      {child.title}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </nav>
  )
}

export function Layout({ children, title, navigation, tableOfContents, pageProps }) {
  let router = useRouter()
  let isDocsPage = router.pathname === '/onechart-reference'
  let isYamlGeneratorPage = router.pathname === '/'

  let section = navigation.find((section) =>
    section.links.find((link) => link.href === router.pathname)
  )

  let bg = 'bg-white dark:bg-neutral-900'

  return (
    <div className={bg}>
      {isYamlGeneratorPage && <YamlGenerator />}

      {isDocsPage && (
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex gap-8">
            {/* Table of Contents - Left Sidebar */}
            <aside className="hidden lg:block w-64 flex-shrink-0">
              {tableOfContents && tableOfContents.length > 0 && (
                <TableOfContents tableOfContents={tableOfContents} />
              )}
            </aside>

            {/* Main Content */}
            <main className="flex-1 min-w-0">
              <Prose className="!max-w-none">
                {children}
              </Prose>
            </main>
          </div>
        </div>
      )}
    </div>
  )
}
