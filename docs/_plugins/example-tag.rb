module Jekyll
    class ExampleTag < Liquid::Tag

        def initialize(tag_name, text, tokens)
            super
            @text = text
        end

        def render(context)
            site = context.registers[:site]
            filename = @text.strip

            file_path = File.join(site.source, '_examples', filename)
            html = File.open(file_path).read

            html = html.gsub('https://unpkg.com/@fqqb/timeline', '/timeline/assets/timeline.js')
            html = html.gsub('"timeline"', '"id_' + filename + '"')
            html = html.gsub("'timeline'", "'id_" + filename + "'")

            "<div class=\"example\">#{html}</div>"
        end
    end
end

Liquid::Template.register_tag('example', Jekyll::ExampleTag)
