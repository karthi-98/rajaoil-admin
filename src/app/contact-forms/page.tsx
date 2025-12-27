'use client'

import { useState, useEffect } from 'react'
import { ContactForm } from '@/types/contactForm'
import { formatDate, getStatusColor, truncateMessage } from '@/lib/contactFormUtils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Search, Filter, RefreshCw, Eye, MessageSquare, Archive, Trash2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from 'sonner'
import { db } from '@/lib/firebase'
import { collection, query, where, getDocs, updateDoc, doc, deleteDoc } from 'firebase/firestore'

interface ContactFormWithStatus extends ContactForm {
  selected?: boolean
}

export default function ContactFormsPage() {
  const [contactForms, setContactForms] = useState<ContactFormWithStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedForm, setSelectedForm] = useState<ContactForm | null>(null)
  const [selectedStatus, setSelectedStatus] = useState<ContactForm['status'] | null>(null)
  const [adminNotes, setAdminNotes] = useState('')
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [formToDelete, setFormToDelete] = useState<string | null>(null)

  const fetchContactForms = async () => {
    try {
      setLoading(true)
      const contactFormsRef = collection(db, 'rajaoil', 'others', 'contactForm')
      let q = query(contactFormsRef)

      // Apply status filter
      if (statusFilter !== 'all') {
        q = query(contactFormsRef, where('status', '==', statusFilter))
      }

      const querySnapshot = await getDocs(q)
      const forms: ContactFormWithStatus[] = []

      querySnapshot.forEach((doc) => {
        const data = doc.data()
        forms.push({
          id: doc.id,
          name: data.name || '',
          mobile: data.mobile || '',
          email: data.email || '',
          product: data.product || '',
          message: data.message || '',
          status: data.status || 'new',
          contacted: data.contacted || false,
          contactedVia: data.contactedVia || '',
          adminNotes: data.adminNotes || '',
          assignedTo: data.assignedTo || '',
          createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
          contactedAt: data.contactedAt?.toDate?.()?.toISOString() || null,
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null,
        })
      })

      // Sort by creation date (newest first)
      forms.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0).getTime()
        const dateB = new Date(b.createdAt || 0).getTime()
        return dateB - dateA
      })

      setContactForms(forms)
    } catch (error) {
      console.error('Error fetching contact forms:', error)
      toast.error('Failed to fetch contact forms')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchContactForms()
  }, [statusFilter])

  const handleSearch = () => {
    // Search is handled by filter function below
  }

  const handleViewDetails = (form: ContactForm) => {
    setSelectedForm(form)
    setSelectedStatus(form.status)
    setAdminNotes(form.adminNotes || '')
    setIsDetailsDialogOpen(true)
  }


  const handleSaveChanges = async () => {
    if (!selectedForm || !selectedStatus) return

    try {
      setIsUpdating(true)
      const formRef = doc(db, 'rajaoil', 'others', 'contactForm', selectedForm.id)
      await updateDoc(formRef, {
        status: selectedStatus,
        adminNotes: adminNotes,
        updatedAt: new Date(),
      })
      toast.success('Changes saved successfully')
      setIsDetailsDialogOpen(false)
      fetchContactForms()
    } catch (error) {
      console.error('Error saving changes:', error)
      toast.error('Failed to save changes')
    } finally {
      setIsUpdating(false)
    }
  }

  const openDeleteDialog = (formId: string) => {
    setFormToDelete(formId)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteForm = async () => {
    if (!formToDelete) return

    try {
      setIsUpdating(true)
      const formRef = doc(db, 'rajaoil', 'others', 'contactForm', formToDelete)
      await deleteDoc(formRef)
      toast.success('Contact form deleted successfully')
      setIsDeleteDialogOpen(false)
      setIsDetailsDialogOpen(false)
      setFormToDelete(null)
      fetchContactForms()
    } catch (error) {
      console.error('Error deleting form:', error)
      toast.error('Failed to delete contact form')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleArchiveForm = async (formId: string) => {
    try {
      const formRef = doc(db, 'rajaoil', 'others', 'contactForm', formId)
      await updateDoc(formRef, {
        status: 'archived',
        updatedAt: new Date(),
      })
      toast.success('Contact form archived')
      fetchContactForms()
    } catch (error) {
      console.error('Error archiving form:', error)
      toast.error('Failed to archive contact form')
    }
  }

  // Filter contact forms based on search term
  const filteredForms = contactForms.filter((form) => {
    if (!searchTerm) return true
    const searchLower = searchTerm.toLowerCase()
    return (
      form.name.toLowerCase().includes(searchLower) ||
      form.mobile.includes(searchTerm) ||
      form.email.toLowerCase().includes(searchLower) ||
      form.product.toLowerCase().includes(searchLower) ||
      form.message.toLowerCase().includes(searchLower)
    )
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Contact Forms</h2>
        <p className="text-muted-foreground">View and manage customer contact form submissions</p>
      </div>

      {/* Filters and Search */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 flex gap-2">
              <Input
                placeholder="Search by name, mobile, email, product, or message..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleSearch} variant="outline" size="icon">
                <Search className="h-4 w-4" />
              </Button>
            </div>

            {/* Status Filter */}
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="contacted">Contacted</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>

              <Button onClick={fetchContactForms} variant="outline" size="icon">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Forms Table */}
      <Card>
        <CardHeader>
          <CardTitle>Contact Form Submissions</CardTitle>
          <CardDescription>
            {filteredForms.length} contact form(s) found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filteredForms.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No contact forms found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Mobile</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredForms.map((form) => (
                    <TableRow key={form.id}>
                      <TableCell className="font-medium">{form.name}</TableCell>
                      <TableCell>{form.mobile}</TableCell>
                      <TableCell>{form.email}</TableCell>
                      <TableCell className="font-medium">{form.product}</TableCell>
                      <TableCell>
                        <div className="max-w-xs text-sm text-gray-600">
                          {truncateMessage(form.message, 50)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(form.status)}>
                          {form.status.charAt(0).toUpperCase() + form.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {formatDate(form.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            onClick={() => handleViewDetails(form)}
                            variant="ghost"
                            size="sm"
                            title="View details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            onClick={() => openDeleteDialog(form.id)}
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedForm && (
            <>
              <DialogHeader>
                <DialogTitle>Contact Form Details</DialogTitle>
                <DialogDescription>
                  Submitted on {formatDate(selectedForm.createdAt)}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* Contact Information */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Name</label>
                    <p className="mt-1 text-base">{selectedForm.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Mobile</label>
                    <p className="mt-1 text-base">{selectedForm.mobile}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Email</label>
                    <p className="mt-1 text-base">{selectedForm.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Product</label>
                    <p className="mt-1 text-base">{selectedForm.product}</p>
                  </div>
                </div>

                {/* Status */}
                <div>
                  <label className="text-sm font-medium text-gray-600 block mb-2">Status</label>
                  <Select
                    value={selectedStatus || selectedForm.status}
                    onValueChange={(value) => setSelectedStatus(value as ContactForm['status'])}
                    disabled={isUpdating}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="contacted">Contacted</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Message */}
                <div>
                  <label className="text-sm font-medium text-gray-600">Message</label>
                  <div className="mt-2 p-4 bg-gray-50 rounded-lg border">
                    <p className="text-sm whitespace-pre-wrap text-gray-900">{selectedForm.message}</p>
                  </div>
                </div>

                {/* Admin Notes */}
                <div>
                  <label className="text-sm font-medium text-gray-600">Admin Notes</label>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Internal notes (not visible to customer)..."
                    className="mt-2 w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-500"
                    rows={3}
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-2 justify-end pt-4 border-t">
                  <Button
                    variant="destructive"
                    onClick={() => openDeleteDialog(selectedForm.id)}
                    disabled={isUpdating}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsDetailsDialogOpen(false)}
                    disabled={isUpdating}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveChanges}
                    disabled={isUpdating}
                  >
                    {isUpdating ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Contact Form?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this contact form submission. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUpdating}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteForm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isUpdating}
            >
              {isUpdating ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
