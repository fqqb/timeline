module Jekyll
    class ExcerptTag < Liquid::Tag

        def initialize(tag_name, text, tokens)
            super
            @text = text
        end

        def render(context)
            site = context.registers[:site]

            parts = @text.strip.split
            filename = parts[0]
            excerpt_id = parts[1]

            file_path = File.join(site.source, '_examples', filename)
            lines = []
            begin_marker = 'BEGIN ' + excerpt_id
            end_marker = 'END ' + excerpt_id

            output = false
            File.open(file_path).readlines.each do |line|
                if line.include? begin_marker
                    output = true
                elsif line.include? end_marker
                    output = false
                elsif output
                    lines << line
                end
            end

            # Dedent according to the least indent
            leading_spaces = -1
            lines.each do |line|
                next if line.strip.empty?

                spaces = line.index(/[^ ]/)
                if leading_spaces == -1 || spaces < leading_spaces
                    leading_spaces = spaces
                end
            end
            leading_spaces = 0 if leading_spaces == -1


            markdown = "```javascript\n"
            lines.each do |line|
                slice = line[leading_spaces..-1]
                if slice
                    markdown += slice
                else
                    markdown += "\n"
                end
            end
            markdown += "```\n"

            markdown
        end
    end
end

Liquid::Template.register_tag('excerpt', Jekyll::ExcerptTag)
