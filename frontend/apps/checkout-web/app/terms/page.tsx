'use client';

import Link from 'next/link';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <Link href="/" className="text-green-600 hover:text-green-700 font-medium">
            ← Back to Home
          </Link>
        </div>

        <article className="bg-white rounded-lg shadow-md p-8 prose prose-sm max-w-full">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Terms and Conditions</h1>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Introduction</h2>
            <p className="text-gray-700 mb-4">
              Welcome to SafeCart. These Terms and Conditions ("Terms") govern your use of our platform and services.
              By accessing or using SafeCart, you agree to be bound by these Terms. If you do not agree to any part of
              these Terms, you may not use our platform.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Our Services</h2>
            <p className="text-gray-700 mb-4">
              SafeCart is an e-commerce platform that provides a secure escrow payment system for online transactions.
              We facilitate transactions between buyers and sellers while holding payments in escrow to ensure security
              for both parties.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. User Accounts</h2>
            <p className="text-gray-700 mb-4">
              To use SafeCart, you must create an account by providing accurate and complete information. You are
              responsible for maintaining confidentiality of your credentials and for all activities that occur under
              your account. You agree to notify us immediately of any unauthorized use.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Payment and Escrow</h2>
            <p className="text-gray-700 mb-4">
              SafeCart holds buyer payments in escrow for the duration specified in the transaction. Payments are
              released to sellers upon order completion or as per our dispute resolution process. All transactions are
              subject to our fee structure as displayed on the platform.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Dispute Resolution</h2>
            <p className="text-gray-700 mb-4">
              In case of disputes between buyers and sellers, SafeCart provides a dispute resolution process. Users are
              required to submit evidence and documentation to support their claims. SafeCart's decision on disputes is
              final and binding.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. User Responsibilities</h2>
            <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
              <li>Provide accurate and truthful information</li>
              <li>Comply with all applicable laws and regulations</li>
              <li>Not engage in fraudulent or illegal activities</li>
              <li>Respect intellectual property rights</li>
              <li>Not harass, abuse, or threaten other users</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Limitation of Liability</h2>
            <p className="text-gray-700 mb-4">
              SafeCart is provided on an "as-is" basis. We are not liable for any indirect, incidental, or
              consequential damages arising from your use of the platform. Our total liability is limited to the amount
              of fees paid in the transaction.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Privacy</h2>
            <p className="text-gray-700 mb-4">
              Your use of SafeCart is also governed by our Privacy Policy. Please see our Privacy Policy for
              information on how we collect, use, and protect your personal data.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Modifications to Terms</h2>
            <p className="text-gray-700 mb-4">
              SafeCart reserves the right to modify these Terms at any time. Changes will be effective immediately upon
              posting. Your continued use of the platform constitutes acceptance of the modified Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Termination</h2>
            <p className="text-gray-700 mb-4">
              SafeCart may terminate or suspend your account at any time for violations of these Terms or for any other
              reason at our sole discretion. Upon termination, your right to use the platform immediately ceases.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Contact Us</h2>
            <p className="text-gray-700">
              If you have any questions about these Terms, please contact us at support@safecart.bd
            </p>
          </section>

          <section className="mt-12 pt-8 border-t border-gray-200">
            <p className="text-gray-600 text-sm">Last updated: March 2026</p>
          </section>
        </article>

        <div className="mt-6">
          <Link href="/" className="text-green-600 hover:text-green-700 font-medium">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
