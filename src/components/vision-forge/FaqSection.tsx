
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

const faqs = [
  {
    question: "What is Imagen BrainAi?",
    answer: "Imagen BrainAi is a powerful AI image generator that turns your text descriptions into unique, high-quality images using Google's latest AI models. It's designed for artists, designers, marketers, and anyone looking to bring their creative ideas to life."
  },
  {
    question: "How do credits work?",
    answer: "The Free plan allows you to explore the application's interface. To generate images, you must upgrade to a Pro or Mega plan. These paid plans come with a monthly allowance of Google Credits, which are used to power the advanced AI models for each image you create."
  },
  {
    question: "Can I use the generated images for commercial purposes?",
    answer: "Images generated under the Pro and Mega plans include a commercial license, allowing you to use them for your business, marketing, and other commercial projects. The Free plan does not include image generation."
  },
  {
    question: "Do my credits roll over to the next month?",
    answer: "Monthly credits on the Pro and Mega plans are renewed on your billing date and do not roll over to the next month."
  },
  {
    question: "How do I upgrade my plan?",
    answer: "You can upgrade your plan by visiting the Pricing page and selecting the Pro or Mega plan. After purchase, use the 'Activate Plan' button in the header and enter the email you used for the purchase to activate your new benefits."
  },
  {
    question: "What aspect ratios are supported?",
    answer: "We support a wide range of aspect ratios, including square (1:1), widescreen (16:9), portrait (9:16), and many more. Our premium models strictly adhere to the selected ratio for precise compositions."
  },
  {
    question: "How can I get better results from my prompts?",
    answer: "Be descriptive and specific. Use adjectives and details about the style, mood, and lighting you want. For paid plan users, our AI-powered 'Improve Prompt' feature can analyze your idea and suggest a more effective prompt."
  },
  {
    question: "Is my data and are my generations private?",
    answer: "We prioritize your privacy. The prompts you enter and the images you generate are processed securely. Please refer to our Privacy Policy for detailed information on how we handle your data."
  },
  {
    question: "What happens when my paid plan expires?",
    answer: "Your plan is valid for 30 days from the date of purchase. After it expires, your account will automatically revert to the Free plan, and you will need to purchase a new plan to continue generating images."
  }
];

export function FaqSection() {
  return (
    <section id="faq" className="bg-muted py-16">
      <div className="container mx-auto px-4">
        <header className="text-center mb-12">
          <h2 className="text-4xl font-extrabold tracking-tight text-primary mb-3">
            Frequently Asked <span className="text-accent">Questions</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Have questions? We've got answers. If you need more help, feel free to contact us.
          </p>
        </header>
        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem value={`item-${index}`} key={index} className="border-b">
                <AccordionTrigger className="text-left font-semibold text-lg text-foreground hover:no-underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-base text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  )
}
