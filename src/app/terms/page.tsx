
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service | Imagen BrainAi',
  description: 'Read the Terms of Service for Imagen BrainAi. By using our services, you agree to these terms.',
};

export default function TermsOfServicePage() {
  return (
    <main className="container mx-auto py-12 px-4">
      <header className="text-center mb-10">
        <h1 className="text-4xl font-extrabold tracking-tight text-primary mb-3">
          Terms of Service
        </h1>
        <p className="text-lg text-muted-foreground">Last Updated: June 27, 2024</p>
      </header>

      <div className="max-w-3xl mx-auto space-y-6 text-foreground/80 text-base leading-relaxed">
        <section>
          <h2 className="text-2xl font-semibold text-foreground mb-3">1. Acceptance of Terms</h2>
          <p>
            By accessing and using Imagen BrainAi (the "Service"), you accept and agree to be bound by the terms and provision of this agreement. In addition, when using this Service's particular services, you shall be subject to any posted guidelines or rules applicable to such services. Any participation in this Service will constitute acceptance of this agreement. If you do not agree to abide by the above, please do not use this Service.
          </p>
           <p className="font-bold mt-2 text-destructive">
            IMPORTANT: This is a template Terms of Service and should be reviewed and customized by a legal professional. Do not use this template as-is for your live website.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-foreground mb-3">2. Description of Service</h2>
          <p>
            Imagen BrainAi provides users with AI-powered image generation tools. This includes features for text-to-image synthesis, prompt assistance, and style customization (the "Service"). You understand and agree that the Service may include advertisements and that these advertisements are necessary for Imagen BrainAi to provide the Service. You also understand and agree that the Service may include certain communications from Imagen BrainAi, such as service announcements, administrative messages, and newsletters, and that these communications are considered part of Imagen BrainAi membership and you may not be able to opt out of receiving them.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-foreground mb-3">3. User Responsibilities and Conduct</h2>
          <p>
            You are responsible for your own conduct and content while using the Service and for any consequences thereof. You agree to use the Service only for purposes that are legal, proper and in accordance with these Terms and any applicable policies or guidelines. By way of example, and not as a limitation, you agree that when using the Service, you will not:
          </p>
          <ul className="list-disc list-inside pl-4 mt-2 space-y-1">
            <li>Defame, abuse, harass, stalk, threaten or otherwise violate the legal rights (such as rights of privacy and publicity) of others.</li>
            <li>Upload, post, email, transmit or otherwise make available any inappropriate, defamatory, infringing, obscene, or unlawful content.</li>
            <li>Upload, post, email, transmit or otherwise make available any content that infringes any patent, trademark, trade secret, copyright or other proprietary rights of any party.</li>
            <li>Use the Service for any illegal or unauthorized purpose.</li>
            <li>Interfere with or disrupt the Service or servers or networks connected to the Service.</li>
            <li>Generate content that is harmful, hateful, discriminatory, or violent.</li>
          </ul>
          <p>We reserve the right to terminate your access to the Service for violating any of these prohibited uses.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-foreground mb-3">4. Intellectual Property Rights</h2>
          <p>
            <strong>Your Content:</strong> You retain ownership of the prompts you submit and any original aspects of the images generated based on your prompts, to the extent permitted by law. However, by using the Service, you grant Imagen BrainAi a worldwide, non-exclusive, royalty-free license to use, reproduce, modify, and display the generated images solely for the purpose of providing and improving the Service.
          </p>
          <p className="mt-2">
            <strong>Our Content:</strong> The Service and its original content (excluding content provided by users), features, and functionality are and will remain the exclusive property of Imagen BrainAi and its licensors.
          </p>
        </section>
        
        <section>
          <h2 className="text-2xl font-semibold text-foreground mb-3">5. Disclaimer of Warranties</h2>
          <p>
            The Service is provided on an "AS IS" and "AS AVAILABLE" basis. Imagen BrainAi makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights. Further, Imagen BrainAi does not warrant or make any representations concerning the accuracy, likely results, or reliability of the use of the materials on its website or otherwise relating to such materials or on any sites linked to this site. AI-generated content can be unpredictable and may not always meet expectations.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-foreground mb-3">6. Limitation of Liability</h2>
          <p>
            In no event shall Imagen BrainAi or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on Imagen BrainAi's website, even if Imagen BrainAi or a Imagen BrainAi authorized representative has been notified orally or in writing of the possibility of such damage.
          </p>
        </section>
        
        <section>
          <h2 className="text-2xl font-semibold text-foreground mb-3">7. Modifications to Terms</h2>
          <p>
            Imagen BrainAi reserves the right, at its sole discretion, to modify or replace these Terms at any time. If a revision is material we will try to provide at least 30 days' notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-foreground mb-3">8. Governing Law</h2>
          <p>
            These Terms shall be governed and construed in accordance with the laws of [Your Jurisdiction, e.g., State of California, USA], without regard to its conflict of law provisions.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-foreground mb-3">9. Contact Us</h2>
          <p>
            If you have any questions about these Terms, please contact us at:
            <br />
            Imagen BrainAi Team
            <br />
            Email: <a href="mailto:legal@imagenbrain.ai" className="text-primary hover:underline">legal@imagenbrain.ai</a>
          </p>
        </section>
        <p className="font-bold mt-4 text-destructive text-center">
            Reminder: This content is for placeholder purposes only. Consult with a legal professional to create compliant Terms of Service.
        </p>
      </div>
    </main>
  );
}
