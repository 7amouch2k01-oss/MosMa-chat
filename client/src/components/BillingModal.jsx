import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useToast } from './Toast';
import { X, CreditCard, ShieldCheck, Sparkles, ArrowLeft, Loader2, Check } from 'lucide-react';
import './BillingModal.css';

const BACKEND_URL = import.meta.env.PROD ? window.location.origin : `${window.location.protocol}//${window.location.hostname}:5000`;
const API_URL = `${BACKEND_URL}/api`;

const BillingModal = ({ isOpen, onClose, onSuccess, initialTier = 'pro' }) => {
    const { addToast } = useToast();
    const [step, setStep] = useState('plans'); // 'plans' | 'checkout'
    const [selectedTier, setSelectedTier] = useState(initialTier);
    const [loading, setLoading] = useState(false);

    // Form inputs
    const [cardNumber, setCardNumber] = useState('');
    const [cardName, setCardName] = useState('');
    const [cardExpiry, setCardExpiry] = useState('');
    const [cardCvv, setCardCvv] = useState('');

    useEffect(() => {
        if (isOpen) {
            setStep('plans');
            setSelectedTier(initialTier);
            setCardNumber('');
            setCardName('');
            setCardExpiry('');
            setCardCvv('');
        }
    }, [isOpen, initialTier]);

    if (!isOpen) return null;

    const handlePlanSelect = (tier) => {
        setSelectedTier(tier);
        setStep('checkout');
    };

    const handleCardNumberChange = (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 16) value = value.slice(0, 16);
        const formatted = value.match(/.{1,4}/g)?.join(' ') || value;
        setCardNumber(formatted);
    };

    const handleExpiryChange = (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 4) value = value.slice(0, 4);
        if (value.length > 2) {
            value = value.slice(0, 2) + '/' + value.slice(2);
        }
        setCardExpiry(value);
    };

    const handleCvvChange = (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 3) value = value.slice(0, 3);
        setCardCvv(value);
    };

    const handleUpgradeSubmit = async (e) => {
        e.preventDefault();
        if (cardNumber.replace(/\s/g, '').length !== 16) {
            addToast('Please enter a valid 16-digit card number', 'error');
            return;
        }
        if (!cardName.trim()) {
            addToast('Please enter the cardholder name', 'error');
            return;
        }
        if (cardExpiry.length !== 5) {
            addToast('Please enter expiry in MM/YY format', 'error');
            return;
        }
        if (cardCvv.length !== 3) {
            addToast('Please enter a 3-digit CVV code', 'error');
            return;
        }

        setLoading(true);
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
            const token = userInfo.token;
            if (!token) {
                addToast('Authentication error. Please re-login.', 'error');
                setLoading(false);
                return;
            }

            const response = await axios.put(
                `${API_URL}/users/upgrade`,
                { tier: selectedTier },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            // Update localStorage userInfo with the response data (keep token!)
            const updatedUserInfo = {
                ...userInfo,
                ...response.data,
            };
            localStorage.setItem('userInfo', JSON.stringify(updatedUserInfo));

            addToast(`Successfully upgraded to ${selectedTier.toUpperCase()}! Enjoy your premium perks.`, 'success');
            
            if (onSuccess) {
                onSuccess(updatedUserInfo);
            }
            onClose();
        } catch (error) {
            console.error('Upgrade subscription error:', error);
            const msg = error.response?.data?.message || 'Failed to complete transaction';
            addToast(msg, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="billing-modal-overlay">
            <div className="billing-modal-container glass">
                <button className="billing-modal-close" onClick={onClose}>
                    <X size={20} />
                </button>

                {step === 'plans' ? (
                    <div className="billing-plans-view">
                        <div className="billing-header">
                            <Sparkles className="billing-header-icon" />
                            <h2>Choose Your Premium Upgrade</h2>
                            <p>Unlock premium capabilities to supercharge your chat experience</p>
                        </div>

                        <div className="billing-plans-grid">
                            {/* PRO PLAN */}
                            <div className={`billing-plan-card ${selectedTier === 'pro' ? 'active-pro' : ''}`}>
                                <div className="plan-badge-pro">PRO</div>
                                <h3>Pro Member</h3>
                                <div className="plan-price">
                                    <span className="price-symbol">$</span>
                                    <span className="price-amount">4.99</span>
                                    <span className="price-period">/ month</span>
                                </div>
                                <p className="plan-desc">Great for productivity & organized workflows</p>
                                <ul className="plan-features">
                                    <li><Check size={16} className="feat-check" /> <span><strong>Task Board</strong> access</span></li>
                                    <li><Check size={16} className="feat-check" /> <span>Create up to <strong>10 rooms</strong> (from 3)</span></li>
                                    <li><Check size={16} className="feat-check" /> <span>Exclusive **PRO** profile badge</span></li>
                                    <li><Check size={16} className="feat-check" /> <span>Custom profiles & themes</span></li>
                                </ul>
                                <button className="plan-select-btn btn-pro" onClick={() => handlePlanSelect('pro')}>
                                    Upgrade to Pro
                                </button>
                            </div>

                            {/* ELITE PLAN */}
                            <div className={`billing-plan-card ${selectedTier === 'elite' ? 'active-elite' : ''}`}>
                                <div className="plan-badge-elite">ELITE</div>
                                <div className="plan-popular-tag">MOST POPULAR</div>
                                <h3>Elite Access</h3>
                                <div className="plan-price">
                                    <span className="price-symbol">$</span>
                                    <span className="price-amount">9.99</span>
                                    <span className="price-period">/ month</span>
                                </div>
                                <p className="plan-desc">Uncapped capabilities and status indicators</p>
                                <ul className="plan-features">
                                    <li><Check size={16} className="feat-check-elite" /> <span><strong>Voice & Video Calling</strong></span></li>
                                    <li><Check size={16} className="feat-check-elite" /> <span><strong>Unlimited</strong> chat rooms</span></li>
                                    <li><Check size={16} className="feat-check-elite" /> <span><strong>Global Announcements</strong> broadcast</span></li>
                                    <li><Check size={16} className="feat-check-elite" /> <span>Custom **ELITE** gold badge</span></li>
                                    <li><Check size={16} className="feat-check-elite" /> <span>Exclusive Gold profile border</span></li>
                                    <li><Check size={16} className="feat-check-elite" /> <span>Includes all Pro benefits</span></li>
                                </ul>
                                <button className="plan-select-btn btn-elite" onClick={() => handlePlanSelect('elite')}>
                                    Unlock Elite Access
                                </button>
                            </div>
                        </div>

                        <div className="billing-footer-info">
                            <ShieldCheck size={16} />
                            <span>100% Secure Checkout. Cancel anytime in settings.</span>
                        </div>
                    </div>
                ) : (
                    <div className="billing-checkout-view">
                        <button className="billing-back-btn" onClick={() => setStep('plans')}>
                            <ArrowLeft size={16} /> Back to plans
                        </button>

                        <div className="checkout-title">
                            <h2>Complete Payment</h2>
                            <p>You are upgrading to <strong>{selectedTier === 'pro' ? 'Pro Member' : 'Elite Access'}</strong></p>
                        </div>

                        {/* Visual Card Component */}
                        <div className={`checkout-card-preview ${selectedTier === 'elite' ? 'card-elite' : 'card-pro'}`}>
                            <div className="card-top">
                                <CreditCard size={32} className="card-chip" />
                                <div className="card-brand">{selectedTier.toUpperCase()}</div>
                            </div>
                            <div className="card-number">
                                {cardNumber || '•••• •••• •••• ••••'}
                            </div>
                            <div className="card-bottom">
                                <div className="card-holder">
                                    <label>CARDHOLDER</label>
                                    <div>{cardName.toUpperCase() || 'YOUR NAME HERE'}</div>
                                </div>
                                <div className="card-expiry">
                                    <label>EXPIRES</label>
                                    <div>{cardExpiry || 'MM/YY'}</div>
                                </div>
                                <div className="card-cvv-prev">
                                    <label>CVV</label>
                                    <div>{cardCvv || '•••'}</div>
                                </div>
                            </div>
                        </div>

                        {/* Credit Card Input Form */}
                        <form className="checkout-form" onSubmit={handleUpgradeSubmit}>
                            <div className="form-group-billing">
                                <label htmlFor="billing-card-name">Cardholder Name</label>
                                <input
                                    id="billing-card-name"
                                    type="text"
                                    placeholder="Jane Doe"
                                    value={cardName}
                                    onChange={(e) => setCardName(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="form-group-billing">
                                <label htmlFor="billing-card-number">Card Number</label>
                                <input
                                    id="billing-card-number"
                                    type="text"
                                    placeholder="4000 1234 5678 9010"
                                    value={cardNumber}
                                    onChange={handleCardNumberChange}
                                    required
                                />
                            </div>

                            <div className="form-row-billing">
                                <div className="form-group-billing">
                                    <label htmlFor="billing-expiry">Expiration</label>
                                    <input
                                        id="billing-expiry"
                                        type="text"
                                        placeholder="MM/YY"
                                        value={cardExpiry}
                                        onChange={handleExpiryChange}
                                        required
                                    />
                                </div>
                                <div className="form-group-billing">
                                    <label htmlFor="billing-cvv">CVV</label>
                                    <input
                                        id="billing-cvv"
                                        type="text"
                                        placeholder="123"
                                        value={cardCvv}
                                        onChange={handleCvvChange}
                                        required
                                    />
                                </div>
                            </div>

                            <button type="submit" className={`pay-btn ${selectedTier === 'elite' ? 'pay-elite' : 'pay-pro'}`} disabled={loading}>
                                {loading ? (
                                    <>
                                        <Loader2 className="animate-spin" size={18} style={{ animation: 'spin 1s linear infinite', marginRight: '8px' }} /> Processing Transaction...
                                    </>
                                ) : (
                                    `Pay $${selectedTier === 'pro' ? '4.99' : '9.99'} & Upgrade`
                                )}
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BillingModal;
