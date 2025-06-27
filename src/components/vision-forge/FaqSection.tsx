
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

const faqs = [
  {
    question: "What is Imagen BrainAi?",
    answer: "Imagen BrainAi is a powerful AI image generator that turns your text descriptions into unique, high-quality images. It's designed for artists, designers, marketers, and anyone looking to bring their creative ideas to life."
  },
  {
    question: "How do credits work?",
    answer: "The Free plan includes 200 daily credits for standard generation. Pro and Mega plans come with a monthly allowance of premium credits for using advanced models. Each generation consumes a set amount of credits depending on the model and plan."
  },
  {
    question: "What's the difference between Standard and Premium models?",
    answer: "Standard models (Pollinations) are great for exploration and quick generations. Premium models (Google AI) offer significantly higher image quality, better prompt understanding, faster speeds, and generate multiple variations at once."
  },
  {
    question: "Can I use the generated images for commercial purposes?",
    answer: "Images generated under the Free plan are for personal use only. The Pro and Mega plans include a commercial license, allowing you to use the images for your business, marketing, and other commercial projects."
  },
  {
    question: "Do my credits roll over to the next month?",
    answer: "Daily credits on the Free plan reset every 24 hours and do not roll over. Monthly credits on the Pro and Mega plans are renewed on your billing date and do not roll over."
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
    answer: "Be descriptive and specific. Use adjectives and details about the style, mood, and lighting you want. For Pro and Mega users, our AI-powered 'Improve Prompt' feature can analyze your idea and suggest a more effective prompt."
  },
  {
    question: "Is my data and are my generations private?",
    answer: "We prioritize your privacy. The prompts you enter and the images you generate are processed securely. Please refer to our Privacy Policy for detailed information on how we handle your data."
  },
  {
    question: "What happens when my paid plan expires?",
    answer: "Your plan is valid for 30 days from the date of purchase. After it expires, your account will automatically revert to the Free plan. You can purchase a new plan at any time to regain access to premium features and credits."
  }
];

export function FaqSection() {
  return (
    <section id="faq" className="container mx-auto py-16 px-4">
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
            <AccordionItem value={`item-${index}`} key={index}>
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
    </section>
  )
}
