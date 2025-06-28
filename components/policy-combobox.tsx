"use client"

import type * as React from "react"
import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface Policy {
  id: string
  policy_number: string
}

interface PolicyComboboxProps {
  value: string
  onChange: (value: string) => void
  onPolicySelect?: (policy: Policy) => void
}

export function PolicyCombobox({ value, onChange, onPolicySelect }: PolicyComboboxProps) {
  const [inputValue, setInputValue] = useState(value)
  const [isOpen, setIsOpen] = useState(false)
  const [policies, setPolicies] = useState<Policy[]>([])
  const [loading, setLoading] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [wrapperRef])

  // Search for policies
  const searchPolicies = async (query: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/policies/search?query=${encodeURIComponent(query)}`)
      if (response.ok) {
        const data = await response.json()
        setPolicies(data.policies || [])
      } else {
        setPolicies([])
      }
    } catch (error) {
      console.error("Error searching policies:", error)
      setPolicies([])
    } finally {
      setLoading(false)
    }
  }

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)
    onChange(newValue)

    // Search after typing
    if (newValue.length > 0) {
      searchPolicies(newValue)
      setIsOpen(true)
    } else {
      setPolicies([])
      setIsOpen(false)
    }
  }

  // Handle policy selection
  const handleSelect = (policy: Policy) => {
    setInputValue(policy.policy_number)
    onChange(policy.policy_number)
    if (onPolicySelect) {
      onPolicySelect(policy)
    }
    setIsOpen(false)
  }

  // Load initial policies when focused
  const handleFocus = () => {
    if (inputValue) {
      searchPolicies(inputValue)
    } else {
      // Load some initial policies
      searchPolicies("")
    }
    setIsOpen(true)
  }

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <Input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onFocus={handleFocus}
        placeholder="Enter policy number"
        className="w-full"
      />

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
          {loading ? (
            <div className="px-4 py-2 text-sm text-gray-500">Loading...</div>
          ) : policies.length === 0 ? (
            <div className="px-4 py-2 text-sm text-gray-500">No policies found</div>
          ) : (
            <div>
              {policies.map((policy) => (
                <Button
                  key={policy.id}
                  variant="ghost"
                  className="w-full justify-start px-4 py-2 text-left hover:bg-gray-100"
                  onClick={() => handleSelect(policy)}
                >
                  {policy.policy_number}
                </Button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
