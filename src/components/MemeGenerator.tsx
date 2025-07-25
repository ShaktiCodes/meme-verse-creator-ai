import { useState, useRef, useCallback } from "react";
import { Download, Sparkles, Shuffle, TrendingUp, Zap, Globe, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import html2canvas from "html2canvas";
import { toast } from "sonner";

interface MemeTemplate {
  id: string;
  name: string;
  image: string;
  topText: string;
  bottomText: string;
}

const MEME_TEMPLATES: MemeTemplate[] = [
  {
    id: "drake",
    name: "Drake Pointing",
    image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop",
    topText: "",
    bottomText: "",
  },
  {
    id: "distracted",
    name: "Distracted Boyfriend",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop",
    topText: "",
    bottomText: "",
  },
  {
    id: "woman-cat",
    name: "Woman Yelling at Cat",
    image: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&h=400&fit=crop",
    topText: "",
    bottomText: "",
  },
  {
    id: "expanding-brain",
    name: "Expanding Brain",
    image: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=400&fit=crop",
    topText: "",
    bottomText: "",
  },
  {
    id: "success-kid",
    name: "Success Kid",
    image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop",
    topText: "",
    bottomText: "",
  },
  {
    id: "two-buttons",
    name: "Two Buttons",
    image: "https://images.unsplash.com/photo-1552058544-f2b08422138a?w=400&h=400&fit=crop",
    topText: "",
    bottomText: "",
  },
];

const TRENDING_TOPICS = [
  "AI taking over",
  "Working from home",
  "Coffee addiction",
  "Monday morning",
  "Weekend plans",
  "Social media",
  "Online shopping",
  "Procrastination",
];

export const MemeGenerator = () => {
  const [selectedTemplate, setSelectedTemplate] = useState<MemeTemplate>(MEME_TEMPLATES[0]);
  const [topText, setTopText] = useState("");
  const [bottomText, setBottomText] = useState("");
  const [topic, setTopic] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [useHuggingFace, setUseHuggingFace] = useState(true);
  const [hfApiKey, setHfApiKey] = useState("");
  const memeCanvasRef = useRef<HTMLDivElement>(null);

  const generateWithHuggingFace = async () => {
    try {
      const response = await fetch(
        "https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium",
        {
          headers: {
            Authorization: hfApiKey ? `Bearer ${hfApiKey}` : undefined,
            "Content-Type": "application/json",
          },
          method: "POST",
          body: JSON.stringify({
            inputs: `Create a funny meme about ${topic}. Make it short and punchy with top and bottom text.`,
            parameters: {
              max_length: 100,
              temperature: 0.9,
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Hugging Face API failed');
      }

      const result = await response.json();
      const generated = result[0]?.generated_text || result.generated_text || "";
      
      // Parse the generated text into top and bottom
      const lines = generated.split('\n').filter((line: string) => line.trim());
      const topLine = lines[0] || `When ${topic}`;
      const bottomLine = lines[1] || "It be like that sometimes";
      
      setTopText(topLine);
      setBottomText(bottomLine);
      toast.success("Meme text generated with Hugging Face! 🤗");
    } catch (error) {
      console.error('Hugging Face error:', error);
      // Fallback to predefined funny responses
      generateFallbackMeme();
    }
  };

  const generateFallbackMeme = () => {
    const fallbackMemes = [
      { top: `When ${topic}`, bottom: "It be like that sometimes" },
      { top: "Me trying to understand", bottom: topic },
      { top: topic, bottom: "Why must you be like this?" },
      { top: "POV: You're dealing with", bottom: topic },
      { top: `${topic} hits different`, bottom: "Change my mind" },
      { top: "Nobody:", bottom: `${topic}: Allow me to introduce myself` },
      { top: "Me: I won't let this affect me", bottom: `Also me: *affected by ${topic}*` },
      { top: `${topic} be like`, bottom: "I'm about to end this person's whole career" },
    ];
    
    const randomMeme = fallbackMemes[Math.floor(Math.random() * fallbackMemes.length)];
    setTopText(randomMeme.top);
    setBottomText(randomMeme.bottom);
    toast.success("Meme text generated! 🎭");
  };

  const generateWithOpenAI = async () => {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are a hilarious meme generator. Create funny, clever meme text based on the topic provided. Return ONLY a JSON object with "topText" and "bottomText" fields. Keep text short and punchy, suitable for memes. Make it relatable and funny.',
            },
            {
              role: 'user',
              content: `Create a funny meme about: ${topic}`,
            },
          ],
          max_tokens: 150,
          temperature: 0.9,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate meme text');
      }

      const data = await response.json();
      const content = data.choices[0].message.content;
      
      try {
        const memeData = JSON.parse(content);
        setTopText(memeData.topText || "");
        setBottomText(memeData.bottomText || "");
        toast.success("Meme text generated! 🎭");
      } catch (parseError) {
        // Fallback if JSON parsing fails
        const lines = content.split('\n').filter((line: string) => line.trim());
        setTopText(lines[0] || "");
        setBottomText(lines[1] || "");
        toast.success("Meme text generated! 🎭");
      }
    } catch (error) {
      console.error('Error generating meme:', error);
      toast.error("Failed to generate meme text. Check your API key!");
    }
  };

  const generateMemeText = async () => {
    if (!topic.trim()) {
      toast.error("Please enter a topic first!");
      return;
    }

    setIsGenerating(true);
    
    try {
      if (useHuggingFace) {
        await generateWithHuggingFace();
      } else {
        if (!apiKey.trim()) {
          toast.error("Please enter your OpenAI API key!");
          return;
        }
        await generateWithOpenAI();
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadMeme = useCallback(async () => {
    if (!memeCanvasRef.current) return;

    try {
      const canvas = await html2canvas(memeCanvasRef.current, {
        backgroundColor: null,
        scale: 2,
        logging: false,
      });

      const link = document.createElement('a');
      link.download = `meme-${Date.now()}.png`;
      link.href = canvas.toDataURL();
      link.click();
      
      toast.success("Meme downloaded! 📥");
    } catch (error) {
      console.error('Error downloading meme:', error);
      toast.error("Failed to download meme!");
    }
  }, []);

  const selectRandomTemplate = () => {
    const randomIndex = Math.floor(Math.random() * MEME_TEMPLATES.length);
    setSelectedTemplate(MEME_TEMPLATES[randomIndex]);
    toast.success("Random template selected! 🎲");
  };

  const useTrendingTopic = (trendingTopic: string) => {
    setTopic(trendingTopic);
    toast.success(`Topic set: ${trendingTopic} 🔥`);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold mb-4 rainbow-text animate-rainbow-flow">
            🎭 Meme Generator
          </h1>
          <p className="text-xl text-muted-foreground">
            Create viral memes with AI-powered text generation!
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Panel - Controls */}
          <div className="space-y-6">
            {/* AI Generation Options */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-accent" />
                  AI Generation Options
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <Button
                    onClick={() => setUseHuggingFace(true)}
                    variant={useHuggingFace ? "gradient" : "outline"}
                    size="sm"
                    className="flex-1"
                  >
                    <Globe className="w-4 h-4" />
                    Free AI (Recommended)
                  </Button>
                  <Button
                    onClick={() => setUseHuggingFace(false)}
                    variant={!useHuggingFace ? "gradient" : "outline"}
                    size="sm"
                    className="flex-1"
                  >
                    <Zap className="w-4 h-4" />
                    OpenAI (Premium)
                  </Button>
                </div>

                {useHuggingFace ? (
                  <div className="space-y-2">
                    <Label>Hugging Face API Key (Optional - Better results)</Label>
                    <Input
                      type="password"
                      placeholder="hf_... (optional for improved generation)"
                      value={hfApiKey}
                      onChange={(e) => setHfApiKey(e.target.value)}
                    />
                    <div className="bg-accent/20 border border-accent/30 rounded-lg p-3">
                      <p className="text-sm text-accent-foreground">
                        ✨ <strong>FREE MODE:</strong> Works without any API key! 
                        Smart fallback generates funny memes instantly.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label>OpenAI API Key (Required)</Label>
                    <Input
                      type="password"
                      placeholder="sk-..."
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Your API key is stored locally and never sent to our servers.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Topic Input */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  Meme Topic
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="topic">What's your meme about?</Label>
                  <Input
                    id="topic"
                    placeholder="e.g., Monday morning coffee..."
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="w-full"
                  />
                </div>
                
                <Button
                  onClick={generateMemeText}
                  disabled={isGenerating}
                  variant="gradient"
                  size="lg"
                  className="w-full bg-gradient-to-r from-primary to-secondary hover-glow"
                >
                  {isGenerating ? (
                    <>
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Generate Meme Text
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Trending Topics */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-secondary" />
                  Trending Topics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {TRENDING_TOPICS.map((trendingTopic) => (
                    <Badge
                      key={trendingTopic}
                      variant="secondary"
                      className="cursor-pointer hover:scale-105 transition-transform"
                      onClick={() => useTrendingTopic(trendingTopic)}
                    >
                      {trendingTopic}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Text Customization */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Customize Text</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="topText">Top Text</Label>
                  <Textarea
                    id="topText"
                    placeholder="Top text..."
                    value={topText}
                    onChange={(e) => setTopText(e.target.value)}
                    rows={2}
                  />
                </div>
                
                <div>
                  <Label htmlFor="bottomText">Bottom Text</Label>
                  <Textarea
                    id="bottomText"
                    placeholder="Bottom text..."
                    value={bottomText}
                    onChange={(e) => setBottomText(e.target.value)}
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Template Selection */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Meme Templates
                  <Button
                    onClick={selectRandomTemplate}
                    variant="neon"
                    size="sm"
                  >
                    <Shuffle className="w-4 h-4" />
                    Random
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {MEME_TEMPLATES.map((template) => (
                    <div
                      key={template.id}
                      className={`relative cursor-pointer rounded-lg overflow-hidden transition-all hover:scale-105 ${
                        selectedTemplate.id === template.id
                          ? "ring-2 ring-primary neon-glow"
                          : ""
                      }`}
                      onClick={() => setSelectedTemplate(template)}
                    >
                      <img
                        src={template.image}
                        alt={template.name}
                        className="w-full h-20 object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute bottom-1 left-1 right-1">
                        <p className="text-white text-xs font-semibold truncate">
                          {template.name}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Meme Preview */}
          <div className="space-y-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Meme Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  ref={memeCanvasRef}
                  className="relative bg-white rounded-lg overflow-hidden hover-glow"
                  style={{ aspectRatio: "1/1" }}
                >
                  <img
                    src={selectedTemplate.image}
                    alt="Meme template"
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Top Text */}
                  {topText && (
                    <div className="absolute top-4 left-4 right-4 text-center">
                      <div className="meme-text text-2xl md:text-3xl font-black leading-tight">
                        {topText.toUpperCase()}
                      </div>
                    </div>
                  )}
                  
                  {/* Bottom Text */}
                  {bottomText && (
                    <div className="absolute bottom-4 left-4 right-4 text-center">
                      <div className="meme-text text-2xl md:text-3xl font-black leading-tight">
                        {bottomText.toUpperCase()}
                      </div>
                    </div>
                  )}
                </div>

                <Button
                  onClick={downloadMeme}
                  variant="meme"
                  size="xl"
                  className="w-full mt-6"
                  disabled={!topText && !bottomText}
                >
                  <Download className="w-5 h-5" />
                  Download Meme
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};