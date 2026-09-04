'use client'

import * as React from 'react'
import { Tabs as TabsPrimitive } from '@base-ui/react/tabs'

type ClassNameProp = string | undefined

function cx(...parts: ClassNameProp[]): string {
  return parts.filter(Boolean).join(' ')
}

export function Tabs({
  className,
  orientation = 'horizontal',
  ...props
}: React.ComponentPropsWithoutRef<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      data-orientation={orientation}
      className={cx('ui-tabs', className)}
      orientation={orientation}
      {...props}
    />
  )
}

export function TabsList({
  className,
  variant = 'default',
  ...props
}: React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> & {
  variant?: 'default' | 'line'
}) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-variant={variant}
      className={cx(
        'ui-tabs__list',
        variant === 'line' ? 'ui-tabs__list--line' : 'ui-tabs__list--default',
        className,
      )}
      {...props}
    />
  )
}

export function TabsTrigger({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof TabsPrimitive.Tab>) {
  return (
    <TabsPrimitive.Tab
      data-slot="tabs-trigger"
      className={cx('ui-tabs__trigger', className)}
      {...props}
    />
  )
}

export function TabsContent({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof TabsPrimitive.Panel>) {
  return (
    <TabsPrimitive.Panel
      data-slot="tabs-content"
      className={cx('ui-tabs__content', className)}
      {...props}
    />
  )
}
