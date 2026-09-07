import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { supabase } from './supabaseClient'
import './Workflow.css'

const emptyMedicine = { name: '', category: '', quantity: 0, low_stock_threshold: 10, price: 0, expiry_date: '', manufacturer: '', batch_number: '' }

function PatientPharmacy() {
  const { user } = useOutletContext()
  const navigate = useNavigate()
  const [medicines, setMedicines] = useState([])
  const [prescriptions, setPrescriptions] = useState([])
  const [orders, setOrders] = useState([])
  const [doctorNames, setDoctorNames] = useState({})
  const [cart, setCart] = useState([])
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All')
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState(null)
  const [placingOrder, setPlacingOrder] = useState(false)

  const loadPatientData = useCallback(async () => {
    if (!supabase) {
      setStatus({ type: 'error', message: 'Pharmacy is not configured yet.' })
      setLoading(false)
      return
    }
    setLoading(true)
    setStatus(null)
    const [medicineResult, prescriptionResult, orderResult] = await Promise.all([
      supabase.from('medicines').select('*').order('name'),
      supabase.from('prescriptions').select('*').eq('patient_id', user.id).order('created_at', { ascending: false }),
      supabase.from('pharmacy_orders').select('*, pharmacy_order_items(quantity, unit_price, medicine_id, medicines(name))').eq('patient_id', user.id).order('created_at', { ascending: false }),
    ])
    const firstError = medicineResult.error || prescriptionResult.error || orderResult.error
    if (firstError) setStatus({ type: 'error', message: firstError.message })
    setMedicines(medicineResult.data || [])
    setPrescriptions(prescriptionResult.data || [])
    setOrders(orderResult.data || [])
    const doctorIds = [...new Set((prescriptionResult.data || []).map((item) => item.doctor_id).filter(Boolean))]
    if (doctorIds.length) {
      const doctorsResult = await supabase.from('profiles').select('user_id, full_name, email').in('user_id', doctorIds)
      setDoctorNames(Object.fromEntries((doctorsResult.data || []).map((doctor) => [doctor.user_id, doctor.full_name || doctor.email || 'Doctor'])))
    }
    setLoading(false)
  }, [user.id])

  useEffect(() => {
    const timer = setTimeout(loadPatientData, 0)
    return () => clearTimeout(timer)
  }, [loadPatientData])

  const categories = ['All', ...new Set(medicines.map((medicine) => medicine.category).filter(Boolean))]
  const filteredMedicines = medicines.filter((medicine) => {
    const matchesQuery = `${medicine.name} ${medicine.category} ${medicine.description || ''}`.toLowerCase().includes(query.toLowerCase())
    return matchesQuery && (category === 'All' || medicine.category === category)
  })
  const cartTotal = cart.reduce((total, item) => total + Number(item.price) * item.cartQuantity, 0)

  function addToCart(medicine) {
    setCart((current) => {
      const existing = current.find((item) => item.id === medicine.id)
      if (existing) return current.map((item) => item.id === medicine.id ? { ...item, cartQuantity: Math.min(item.cartQuantity + 1, medicine.quantity) } : item)
      return [...current, { ...medicine, cartQuantity: 1 }]
    })
  }

  function changeQuantity(id, amount) {
    setCart((current) => current.map((item) => item.id === id ? { ...item, cartQuantity: Math.max(0, Math.min(item.cartQuantity + amount, item.quantity)) } : item).filter((item) => item.cartQuantity > 0))
  }

  async function placeOrder() {
    if (!cart.length || !supabase) return
    setPlacingOrder(true)
    setStatus(null)
    const { error } = await supabase.rpc('place_pharmacy_order', {
      order_items: cart.map((item) => ({ medicine_id: item.id, quantity: item.cartQuantity })),
    })
    if (error) setStatus({ type: 'error', message: error.message })
    else {
      setCart([])
      setStatus({ type: 'success', message: 'Order placed successfully. Your pharmacy team will process it shortly.' })
      loadPatientData()
    }
    setPlacingOrder(false)
  }

  function stockLabel(medicine) {
    if (medicine.quantity === 0) return ['Out of Stock', 'out']
    if (medicine.quantity <= medicine.low_stock_threshold) return ['Low Stock', 'low']
    return ['In Stock', 'in']
  }

  return <div className="workflow-page"><div className="wrap workflow-shell pharmacy-patient-shell">
    <header className="workflow-header"><button className="back-link" onClick={() => navigate('/patient/dashboard')}>← Dashboard</button><span className="eyebrow"><span className="dot" /> Patient pharmacy</span><h1>Your medicines, ready when you are.</h1><p>Browse available medicines, review prescriptions, and keep every order in one place.</p></header>
    {status && <div className={`workflow-alert ${status.type}`} role="status">{status.message}</div>}
    <section className="workflow-panel"><div className="panel-heading"><div><span className="kicker">Catalogue</span><h2>Find a medicine</h2></div><input className="search-input" aria-label="Search medicines" placeholder="Search medicines" value={query} onChange={(event) => setQuery(event.target.value)} /></div><div className="pharmacy-filters">{categories.map((item) => <button key={item} className={category === item ? 'active' : ''} onClick={() => setCategory(item)}>{item}</button>)}</div>{loading ? <p className="empty-copy">Loading medicines...</p> : filteredMedicines.length === 0 ? <p className="empty-copy">No medicines match your search.</p> : <div className="medicine-cards">{filteredMedicines.map((medicine) => { const [label, tone] = stockLabel(medicine); const inCart = cart.find((item) => item.id === medicine.id); return <article className="medicine-card" key={medicine.id}><div className="medicine-card-top"><span className={`stock-label ${tone}`}>{label}</span><span className="medicine-category">{medicine.category}</span></div><h3>{medicine.name}</h3><p>{medicine.description || 'Quality medicine supplied through Andhra Hospitals pharmacy.'}</p><div className="medicine-card-bottom"><strong>₹{Number(medicine.price).toFixed(2)}</strong><span>{medicine.quantity} available</span></div><button className="btn btn-primary pharmacy-cart-button" disabled={!medicine.quantity} onClick={() => addToCart(medicine)}>{inCart ? `In cart (${inCart.cartQuantity})` : medicine.quantity ? 'Add to cart' : 'Out of stock'}</button></article> })}</div>}</section>
    <div className="pharmacy-two-column"><section className="workflow-panel"><div className="panel-heading"><div><span className="kicker">Doctor instructions</span><h2>My prescriptions</h2></div></div>{loading ? <p className="empty-copy">Loading prescriptions...</p> : prescriptions.length === 0 ? <p className="empty-copy">No prescriptions have been added for you yet.</p> : <div className="table-wrap"><table><thead><tr><th>Doctor</th><th>Medicine</th><th>Dosage</th><th>Frequency</th><th>Duration</th></tr></thead><tbody>{prescriptions.map((prescription) => <tr key={prescription.id}><td>{doctorNames[prescription.doctor_id] || 'Doctor'}</td><td>{medicines.find((medicine) => medicine.id === prescription.medicine_id)?.name || 'Medicine'}</td><td>{prescription.dosage}</td><td>{prescription.frequency}</td><td>{prescription.duration}</td></tr>)}</tbody></table></div>}</section>
      <section className="workflow-panel pharmacy-cart-panel"><div className="panel-heading"><div><span className="kicker">Your basket</span><h2>Cart</h2></div><span className="cart-count">{cart.length} item{cart.length === 1 ? '' : 's'}</span></div>{cart.length === 0 ? <p className="empty-copy">Your cart is empty.</p> : <><div className="cart-items">{cart.map((item) => <div className="cart-item" key={item.id}><div><strong>{item.name}</strong><small>₹{Number(item.price).toFixed(2)} each</small></div><div className="quantity-control"><button aria-label={`Decrease ${item.name}`} onClick={() => changeQuantity(item.id, -1)}>-</button><span>{item.cartQuantity}</span><button aria-label={`Increase ${item.name}`} disabled={item.cartQuantity >= item.quantity} onClick={() => changeQuantity(item.id, 1)}>+</button><button className="remove-cart" onClick={() => changeQuantity(item.id, -item.cartQuantity)}>Remove</button></div></div>)}</div><div className="cart-total"><span>Total</span><strong>₹{cartTotal.toFixed(2)}</strong></div><button className="btn btn-primary" disabled={placingOrder} onClick={() => { if (window.confirm('Place this pharmacy order?')) placeOrder() }}>{placingOrder ? 'Placing order...' : 'Place order'}</button></>}</section></div>
    <section className="workflow-panel"><div className="panel-heading"><div><span className="kicker">Order history</span><h2>My orders</h2></div></div>{loading ? <p className="empty-copy">Loading orders...</p> : orders.length === 0 ? <p className="empty-copy">You have not placed any orders yet.</p> : <div className="table-wrap"><table><thead><tr><th>Order ID</th><th>Date</th><th>Medicines</th><th>Total</th><th>Status</th></tr></thead><tbody>{orders.map((order) => <tr key={order.id}><td>#{order.id.slice(0, 8)}</td><td>{new Date(order.created_at).toLocaleDateString()}</td><td>{(order.pharmacy_order_items || []).map((item) => `${item.medicines?.name || 'Medicine'} × ${item.quantity}`).join(', ')}</td><td>₹{Number(order.total_amount).toFixed(2)}</td><td><span className={`status-pill ${order.status.toLowerCase()}`}>{order.status}</span></td></tr>)}</tbody></table></div>}</section>
  </div></div>
}

function StaffPharmacy() {
  const { user, role } = useOutletContext()
  const navigate = useNavigate()
  const [medicines, setMedicines] = useState([])
  const [prescriptions, setPrescriptions] = useState([])
  const [patients, setPatients] = useState([])
  const [prescriptionForm, setPrescriptionForm] = useState({ patient_id: '', medicine_id: '', dosage: '', frequency: '', duration: '', instructions: '' })
  const [query, setQuery] = useState('')
  const [form, setForm] = useState(emptyMedicine)
  const [editingId, setEditingId] = useState(null)
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    if (!supabase) { setLoading(false); return }
    setLoading(true)
    const medicinesResult = await supabase.from('medicines').select('*').order('name')
    const prescriptionsResult = await supabase.from('prescriptions').select('*').order('created_at', { ascending: false })
    const patientsResult = role === 'doctor' ? await supabase.from('profiles').select('user_id, full_name, email').eq('role', 'patient').order('full_name') : { data: [] }
    if (medicinesResult.error) setStatus({ type: 'error', message: medicinesResult.error.message })
    if (prescriptionsResult.error) setStatus({ type: 'error', message: prescriptionsResult.error.message })
    setMedicines(medicinesResult.data || [])
    setPrescriptions(prescriptionsResult.data || [])
    setPatients(patientsResult.data || [])
    setLoading(false)
  }, [role])

  useEffect(() => {
    const timer = setTimeout(loadData, 0)
    return () => clearTimeout(timer)
  }, [loadData])

  const filteredMedicines = useMemo(() => medicines.filter((medicine) => `${medicine.name} ${medicine.category}`.toLowerCase().includes(query.toLowerCase())), [medicines, query])
  const today = new Date().toISOString().slice(0, 10)
  const nearExpiry = (date) => Math.ceil((new Date(`${date}T00:00:00`) - new Date()) / 86400000) <= 30
  const lowStock = medicines.filter((medicine) => medicine.quantity <= medicine.low_stock_threshold)
  const expired = medicines.filter((medicine) => medicine.expiry_date < today)

  async function saveMedicine(event) {
    event.preventDefault()
    const payload = { ...form, quantity: Number(form.quantity), low_stock_threshold: Number(form.low_stock_threshold), price: Number(form.price) }
    const result = editingId ? await supabase.from('medicines').update(payload).eq('id', editingId) : await supabase.from('medicines').insert(payload)
    if (result.error) setStatus({ type: 'error', message: result.error.message })
    else { setStatus({ type: 'success', message: editingId ? 'Medicine updated.' : 'Medicine added.' }); setForm(emptyMedicine); setEditingId(null); loadData() }
  }

  async function deleteMedicine(id) {
    if (!window.confirm('Delete this medicine from inventory?')) return
    const { error } = await supabase.from('medicines').delete().eq('id', id)
    setStatus(error ? { type: 'error', message: error.message } : { type: 'success', message: 'Medicine deleted.' })
    loadData()
  }

  async function updatePrescription(id, nextStatus) {
    const result = nextStatus === 'Dispensed'
      ? await supabase.rpc('dispense_prescription', { prescription_id: id })
      : await supabase.from('prescriptions').update({ status: nextStatus, updated_at: new Date().toISOString() }).eq('id', id)
    const { error } = result
    setStatus(error ? { type: 'error', message: error.message } : { type: 'success', message: 'Prescription status updated.' })
    loadData()
  }

  async function createPrescription(event) {
    event.preventDefault()
    const { error } = await supabase.from('prescriptions').insert({ ...prescriptionForm, doctor_id: user.id })
    if (error) setStatus({ type: 'error', message: error.message })
    else { setStatus({ type: 'success', message: 'Prescription created.' }); setPrescriptionForm({ patient_id: '', medicine_id: '', dosage: '', frequency: '', duration: '', instructions: '' }); loadData() }
  }

  return <div className="workflow-page"><div className="wrap workflow-shell"><header className="workflow-header"><div><button className="back-link" onClick={() => navigate(`/${role}/dashboard`)}>← Dashboard</button><span className="eyebrow"><span className="dot" /> Pharmacy operations</span><h1>Medicine, clearly accounted for.</h1><p>Track stock, expiry, and the handoff from prescription to dispensing.</p></div></header>{status && <div className={`workflow-alert ${status.type}`}>{status.message}</div>}
    <section className="metric-row"><div><strong>{medicines.length}</strong><span>Items in catalogue</span></div><div className={lowStock.length ? 'attention' : ''}><strong>{lowStock.length}</strong><span>Low stock</span></div><div className={expired.length ? 'danger' : ''}><strong>{expired.length}</strong><span>Expired</span></div><div><strong>{medicines.filter((medicine) => medicine.expiry_date >= today && nearExpiry(medicine.expiry_date)).length}</strong><span>Near expiry</span></div></section>
    <section className="workflow-panel"><div className="panel-heading"><div><span className="kicker">Inventory</span><h2>Medicine stock</h2></div><input className="search-input" placeholder="Search name or category" value={query} onChange={(event) => setQuery(event.target.value)} /></div>{loading ? <p className="empty-copy">Loading inventory...</p> : filteredMedicines.length === 0 ? <p className="empty-copy">No medicines found.</p> : <div className="table-wrap"><table><thead><tr><th>Medicine</th><th>Category</th><th>Stock</th><th>Price</th><th>Expiry</th><th>Manufacturer</th>{(role === 'admin' || role === 'pharmacist') && <th>Manage</th>}</tr></thead><tbody>{filteredMedicines.map((medicine) => <tr key={medicine.id}><td><strong>{medicine.name}</strong><small>{medicine.batch_number || 'No batch recorded'}</small></td><td>{medicine.category}</td><td><span className={medicine.quantity <= medicine.low_stock_threshold ? 'stock-low' : ''}>{medicine.quantity}</span></td><td>₹{Number(medicine.price).toFixed(2)}</td><td><span className={medicine.expiry_date < today ? 'status-pill cancelled' : nearExpiry(medicine.expiry_date) ? 'status-pill pending' : ''}>{medicine.expiry_date}</span></td><td>{medicine.manufacturer || '—'}</td>{(role === 'admin' || role === 'pharmacist') && <td><button className="table-action" onClick={() => { setEditingId(medicine.id); setForm(medicine) }}>Edit</button><button className="table-action danger-text" onClick={() => deleteMedicine(medicine.id)}>Delete</button></td>}</tr>)}</tbody></table></div>}</section>
    {(role === 'admin' || role === 'pharmacist') && <section className="workflow-panel"><div className="panel-heading"><div><span className="kicker">{editingId ? 'Edit item' : 'New item'}</span><h2>{editingId ? 'Update medicine' : 'Add medicine'}</h2></div></div><form className="medicine-form" onSubmit={saveMedicine}>{[['name','Medicine name'],['category','Category'],['manufacturer','Manufacturer'],['batch_number','Batch number'],['expiry_date','Expiry date']].map(([name, label]) => <label key={name}>{label}<input required={['name','category','expiry_date'].includes(name)} type={name === 'expiry_date' ? 'date' : 'text'} value={form[name]} onChange={(event) => setForm({ ...form, [name]: event.target.value })} /></label>)}<label>Quantity<input type="number" min="0" value={form.quantity} onChange={(event) => setForm({ ...form, quantity: event.target.value })} /></label><label>Low-stock threshold<input type="number" min="0" value={form.low_stock_threshold} onChange={(event) => setForm({ ...form, low_stock_threshold: event.target.value })} /></label><label>Price<input type="number" min="0" step="0.01" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} /></label><div className="form-actions"><button type="submit" className="btn btn-primary">{editingId ? 'Save changes' : 'Add medicine'}</button>{editingId && <button type="button" className="btn btn-ghost" onClick={() => { setEditingId(null); setForm(emptyMedicine) }}>Cancel</button>}</div></form></section>}
    {role === 'doctor' && <section className="workflow-panel"><div className="panel-heading"><div><span className="kicker">Clinical order</span><h2>Create prescription</h2></div></div><form className="medicine-form" onSubmit={createPrescription}><label>Patient<select required value={prescriptionForm.patient_id} onChange={(event) => setPrescriptionForm({ ...prescriptionForm, patient_id: event.target.value })}><option value="">Select patient</option>{patients.map((patient) => <option key={patient.user_id} value={patient.user_id}>{patient.full_name || patient.email}</option>)}</select></label><label>Medicine<select required value={prescriptionForm.medicine_id} onChange={(event) => setPrescriptionForm({ ...prescriptionForm, medicine_id: event.target.value })}><option value="">Select medicine</option>{medicines.filter((medicine) => medicine.quantity > 0 && medicine.expiry_date >= today).map((medicine) => <option key={medicine.id} value={medicine.id}>{medicine.name} ({medicine.quantity} available)</option>)}</select></label><label>Dosage<input required value={prescriptionForm.dosage} onChange={(event) => setPrescriptionForm({ ...prescriptionForm, dosage: event.target.value })} placeholder="e.g. 500 mg" /></label><label>Frequency<input required value={prescriptionForm.frequency} onChange={(event) => setPrescriptionForm({ ...prescriptionForm, frequency: event.target.value })} placeholder="e.g. Twice daily" /></label><label>Duration<input required value={prescriptionForm.duration} onChange={(event) => setPrescriptionForm({ ...prescriptionForm, duration: event.target.value })} placeholder="e.g. 5 days" /></label><label>Instructions<input value={prescriptionForm.instructions} onChange={(event) => setPrescriptionForm({ ...prescriptionForm, instructions: event.target.value })} placeholder="Optional" /></label><div className="form-actions"><button type="submit" className="btn btn-primary">Create prescription</button></div></form></section>}
    <section className="workflow-panel"><div className="panel-heading"><div><span className="kicker">Clinical handoff</span><h2>Prescriptions</h2></div></div>{prescriptions.length === 0 ? <p className="empty-copy">No prescriptions to show.</p> : <div className="table-wrap"><table><thead><tr><th>Medicine</th><th>Dosage</th><th>Frequency</th><th>Duration</th><th>Status</th>{(role === 'admin' || role === 'pharmacist') && <th>Update</th>}</tr></thead><tbody>{prescriptions.map((prescription) => <tr key={prescription.id}><td>{medicines.find((medicine) => medicine.id === prescription.medicine_id)?.name || 'Medicine'}</td><td>{prescription.dosage}</td><td>{prescription.frequency}</td><td>{prescription.duration}</td><td><span className={`status-pill ${prescription.status.toLowerCase()}`}>{prescription.status}</span></td>{(role === 'admin' || role === 'pharmacist') && <td><select value={prescription.status} onChange={(event) => updatePrescription(prescription.id, event.target.value)}><option>Prescribed</option><option>Dispensed</option><option>Cancelled</option></select></td>}</tr>)}</tbody></table></div>}</section>
  </div></div>
}

function PharmacyPage() {
  const { role } = useOutletContext()
  return role === 'patient' ? <PatientPharmacy /> : <StaffPharmacy />
}

export default PharmacyPage
