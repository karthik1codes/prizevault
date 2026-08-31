'use client'

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuPortal,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu'

type NavCard = {
  title: string
  description: string
  href: string
}

const PRODUCT_LINKS: NavCard[] = [
  {
    title: 'How it works',
    description: 'Dual-approval escrow from funding through winner payout.',
    href: '#how',
  },
  {
    title: 'Browse events',
    description: 'Open hackathons accepting registrations right now.',
    href: '#events',
  },
]

const PORTAL_LINKS: NavCard[] = [
  {
    title: 'Sponsor console',
    description: 'Fund prize pools and co-approve releases.',
    href: '/verifier',
  },
  {
    title: 'Organizer console',
    description: 'Create events, pick winners, propose payouts.',
    href: '/issuer',
  },
  {
    title: 'Escrow wallet',
    description: 'Register for events and track prize status.',
    href: '/holder',
  },
]

function NavCardLink({ item }: { item: NavCard }) {
  return (
    <NavigationMenuLink href={item.href} closeOnClick className="pv-nav-menu__card">
      <span className="pv-nav-menu__card-title">{item.title}</span>
      <span className="pv-nav-menu__card-desc">{item.description}</span>
    </NavigationMenuLink>
  )
}

export default function LandingNavigationMenu() {
  return (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuLink
            href="#events"
            className={navigationMenuTriggerStyle()}
            closeOnClick
          >
            Events
          </NavigationMenuLink>
        </NavigationMenuItem>

        <NavigationMenuItem value="product">
          <NavigationMenuTrigger>Product</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="pv-nav-menu__grid">
              {PRODUCT_LINKS.map((item) => (
                <li key={item.href}>
                  <NavCardLink item={item} />
                </li>
              ))}
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>

        <NavigationMenuItem value="portals">
          <NavigationMenuTrigger>Portals</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="pv-nav-menu__stack">
              {PORTAL_LINKS.map((item) => (
                <li key={item.href}>
                  <NavCardLink item={item} />
                </li>
              ))}
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>

        <NavigationMenuItem>
          <NavigationMenuLink
            href="#roles"
            className={navigationMenuTriggerStyle()}
            closeOnClick
          >
            Roles
          </NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>

      <NavigationMenuPortal />
    </NavigationMenu>
  )
}
