'use client'

import * as React from 'react'
import { Tabs as TabsPrimitive } from '@base-ui/react/tabs'

type ClassNameValue<TState> =
  | string
  | undefined
  | ((state: TState) => string | undefined)

function cx(...parts: Array<string | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

function mergeClassName<TState>(
  base: string,
  className?: ClassNameValue<TState>,
): string | ((state: TState) => string) {
  if (typeof className === 'function') {
    return (state) => cx(base, className(state))
  }
  return cx(base, className)
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
      className={mergeClassName('ui-tabs', className)}
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
  const base =
    variant === 'line'
      ? 'ui-tabs__list ui-tabs__list--line'
      : 'ui-tabs__list ui-tabs__list--default'

  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-variant={variant}
      className={mergeClassName(base, className)}
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
      className={mergeClassName('ui-tabs__trigger', className)}
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
      className={mergeClassName('ui-tabs__content', className)}
      {...props}
    />
  )
}
