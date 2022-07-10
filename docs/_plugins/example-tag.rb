module Jekyll
    class ExampleTag < Liquid::Tag

        def initialize(tag_name, markup, tokens)
            @markup = markup
            super
        end

        def render(context)
            parts = @markup.split

            markdown = %{
                <div class="timeline-demo">
                    <iframe height="#{parts[1]}"
                            src="/timeline/examples/#{parts[0]}"
                            class="timeline-demo"
                            scrolling="no">
                    </iframe>
                </div>
            }

            markdown.strip!
            markdown
        end
    end
end

Liquid::Template.register_tag('example', Jekyll::ExampleTag)
