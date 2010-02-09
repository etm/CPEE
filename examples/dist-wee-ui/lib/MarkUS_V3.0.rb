# Markup UnderScore
# ----   -    -

module ImplicitSuper
  def self.extended(mod)
    (class << mod; self; end).class_eval do
      define_method :new do |*args|
        allocate.instance_eval do
          mod.instance_method(:initialize).bind(self).call
          initialize(*args)
          self
        end
      end
    end
  end
end

module MarkUS__
  def __markus_initialize
    @__markus = []
    @__markus_buffer = []
    @__markus_level = 0
    @__markus_indent = false
  end

  def __markus_join(buffer)
    @__markus_indent ? buffer.join("\n") : buffer.join
  end

  def __markus_return(local_buffer=false)
    return __markus_join(@__markus_buffer.pop) if local_buffer
    return __markus_join(@__markus_buffer.last) if @__markus_level == 0
    nil
  end

  def return_!
    __markus_return(false)
  end

  def method_missing(name,*args)
    if name.to_s =~ /(.*)(__)$/ || name.to_s =~ /(.*)(_)$/
      local_buffer = $2.length > 1
      @__markus_buffer << [] if local_buffer || @__markus_buffer.length == 0
      tname = $1
      attrs = ""
      content = nil
      args.each do |a|
        case a
          when Hash
            attrs << " " + a.collect { |key,value|
              if key.to_s == 'prefix_!'
                tname = "#{value}:#{tname}"
                nil
              else  
                value.nil? ? nil : "#{key}=\"#{value.to_s.gsub(/"/,"&#34;")}\""
              end  
            }.compact.join(" ")
          when String,Integer
            content = a
        end  
      end
      attrs = '' if attrs == ' '
      if block_given?
        @__markus_level += 1
        if @__markus_indent
          @__markus_buffer.last << "#{"  " * @__markus_level}<#{tname}#{attrs}>"
        else  
          @__markus_buffer.last << "<#{tname}#{attrs}>"
        end  
        unless content.nil?
          if @__markus_indent
            @__markus_buffer.last << "#{"  " * (@__markus_level+1)}#{content}"
          else
            @__markus_buffer.last << "#{content}"
          end
        end
        res = yield
        @__markus_buffer.last << res if String === res
        if @__markus_indent
          @__markus_buffer.last << "#{"  " * @__markus_level}</#{tname}>"
        else
          @__markus_buffer.last << "</#{tname}>"
        end  
        @__markus_level -= 1
      else
        if content.nil?
          if @__markus_indent
            @__markus_buffer.last << "#{"  " * (@__markus_level+1)}<#{tname}#{attrs}/>"
          else
            @__markus_buffer.last << "<#{tname}#{attrs}/>"
          end
        else
          if @__markus_indent
            @__markus_buffer.last << "#{"  " * (@__markus_level+1)}<#{tname}#{attrs}>#{content}</#{tname}>" 
          else
            @__markus_buffer.last << "<#{tname}#{attrs}>#{content}</#{tname}>" 
          end
        end  
      end  
      return __markus_return local_buffer
    else
      super
    end  
  end

  def text_!(content)
    @__markus_buffer << [] if @__markus_buffer.length == 0
    if @__markus_indent
      @__markus_buffer.last << "#{"  " * (@__markus_level+1)}#{content}"
    else
      @__markus_buffer.last << content.to_s
    end      
    __markus_return
  end
  def javascript_!(content)
    script_ :type => 'text/javascript' do
      "//<![CDATA[\n#{content}#{"  " * (@__markus_level+1)}\n//]]>"
    end
  end
  def javascript__!(content)
    script__ :type => 'text/javascript' do
      "//<![CDATA[\n#{content}#{"  " * (@__markus_level+1)}\n//]]>"
    end
  end
  def space_!
    text_! "&#160;"
  end
end  

class MarkUS
  extend ImplicitSuper
  include MarkUS__
  def initialize; __markus_initialize; end
end  

module MarkUSModule
  include MarkUS__
  def self.included(mod)
    mod.class_eval do
      alias_method :__markus_initialize_orig, :initialize
      def initialize(*args)
        __markus_initialize_orig(*args)
        __markus_initialize
      end
    end
  end
end  
