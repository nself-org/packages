import type { Meta, StoryObj } from '@storybook/react'
import { LegalPageLayout } from './LegalPageLayout'

// A1-T08: LegalPageLayout stories

const meta: Meta<typeof LegalPageLayout> = {
  title: 'Layout/LegalPageLayout',
  component: LegalPageLayout,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof LegalPageLayout>

const LegalBody = () => (
  <>
    <h2 id="acceptance">Acceptance of Terms</h2>
    <p>
      By accessing or using ɳSelf, you agree to be bound by these Terms of Service and all
      applicable laws and regulations. If you do not agree with any of these terms, you are
      prohibited from using or accessing this site.
    </p>

    <h2 id="description">Description of Service</h2>
    <p>
      ɳSelf is a self-hosted backend infrastructure platform. We provide the CLI tooling, plugin
      ecosystem, and optional managed cloud hosting. The core CLI is MIT-licensed and free forever.
    </p>

    <h2 id="user-accounts">User Accounts</h2>
    <p>
      You are responsible for maintaining the confidentiality of your account credentials and for
      all activities that occur under your account.
    </p>

    <h2 id="intellectual-property">Intellectual Property</h2>
    <p>
      The ɳSelf CLI, Admin, and 25 free plugins are released under the MIT License. Paid plugins
      in the ɳSelf Pro bundle are source-available and licensed under a commercial license.
    </p>

    <h2 id="limitation-of-liability">Limitation of Liability</h2>
    <p>
      To the maximum extent permitted by applicable law, ɳSelf shall not be liable for any
      indirect, incidental, special, consequential, or punitive damages.
    </p>

    <h2 id="contact">Contact Information</h2>
    <p>
      For legal inquiries, please contact us at{' '}
      <a href="mailto:legal@nself.org">legal@nself.org</a>.
    </p>
  </>
)

export const TermsOfService: Story = {
  args: {
    title: 'Terms of Service',
    lastUpdated: '2026-04-01',
    children: <LegalBody />,
  },
}

export const PrivacyPolicy: Story = {
  args: {
    title: 'Privacy Policy',
    lastUpdated: '2026-03-15',
    children: (
      <>
        <h2 id="data-we-collect">Data We Collect</h2>
        <p>
          We collect minimal data necessary to operate the service: your email address, account
          information, and anonymized telemetry from the CLI (opt-in only).
        </p>

        <h2 id="how-we-use-data">How We Use Your Data</h2>
        <p>
          Your data is used exclusively to provide, improve, and support the nself service.
          We do not sell or share your data with third parties for advertising purposes.
        </p>

        <h2 id="data-retention">Data Retention</h2>
        <p>
          Account data is retained for the duration of your account plus 90 days after deletion.
          Anonymized telemetry is retained for 24 months.
        </p>

        <h2 id="your-rights">Your Rights</h2>
        <p>
          You have the right to access, correct, or delete your personal data. Contact us at{' '}
          <a href="mailto:privacy@nself.org">privacy@nself.org</a>.
        </p>
      </>
    ),
  },
}

export const WithManualTocItems: Story = {
  args: {
    title: 'Data Processing Agreement',
    lastUpdated: '2026-01-01',
    tocItems: [
      { id: 'definitions', label: 'Definitions' },
      { id: 'processing-scope', label: 'Scope of Processing' },
      { id: 'obligations', label: 'Processor Obligations' },
      { id: 'sub-processors', label: 'Sub-processors' },
    ],
    children: (
      <>
        <h2 id="definitions">Definitions</h2>
        <p>In this DPA, capitalized terms have the meanings given in the main Agreement.</p>

        <h2 id="processing-scope">Scope of Processing</h2>
        <p>ɳSelf processes personal data as a data processor on behalf of the customer.</p>

        <h2 id="obligations">Processor Obligations</h2>
        <p>ɳSelf shall process personal data only on documented instructions from the customer.</p>

        <h2 id="sub-processors">Sub-processors</h2>
        <p>ɳSelf uses Hetzner Cloud (Germany) and Vercel (CDN) as sub-processors.</p>
      </>
    ),
  },
}

export const EmptyChildren: Story = {
  name: 'Empty children (no crash)',
  args: {
    title: 'Stub Document',
    // Intentionally empty — tests that TOC gracefully handles no headings
    children: undefined,
  },
}

export const NoLastUpdated: Story = {
  args: {
    title: 'Cookie Policy',
    children: (
      <>
        <h2 id="what-are-cookies">What Are Cookies</h2>
        <p>Cookies are small text files stored on your device when you visit our website.</p>
      </>
    ),
  },
}
