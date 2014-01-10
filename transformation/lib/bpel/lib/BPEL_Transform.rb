#!/usr/bin/ruby 
require 'rubygems'
require 'xml/smart'

class BPEL_Transform 

  def initialize(fname)
    @base = ::File.dirname(fname)
    @doc = XML::Smart.open(fname)
    @doc.namespaces = {
      'bpel' => 'http://docs.oasis-open.org/wsbpel/2.0/process/executable',
      'bpws' => 'http://schemas.xmlsoap.org/ws/2003/03/business-process/',
      'ext'  => 'http://www.activebpel.org/2006/09/bpel/extension/query_handling',
      'xsd'  => 'http://www.w3.org/2001/XMLSchema'
    }
    @acounter = 0
    @MULTI = 2
    @vars = {}
  end  

  def transform_dsl # {{{
    @acounter = 0
    @vars = {}
    extract_vars
    spaces = 0
    result = ''
    @doc.find("/bpel:process/bpel:sequence").each do |e|
      result << print_elements(e,spaces)
    end
    result
  end # }}}
  def extract_vars # {{{
    @doc.find("//bpel:variables/bpel:variable").each do |v|
      @vars[v.attributes['name']] = extract_ns_plus v.attributes['messageType']
    end  
  end # }}}
  def transform_data # {{{
    result = "<dataelements>\n"
    @doc.find("//bpel:variables/bpel:variable").each do |v|
      result << print_spaces(@MULTI)
      result << "<" + v.attributes['name'] + "/>\n"
    end  
    result << '</dataelements>'
    result
  end # }}}
  def transform_endpoints # {{{
    result = XML::Smart.string('<endpoints/>')
    result.namespaces = {
      'xsd'  => 'http://www.w3.org/2001/XMLSchema',
    }
    @doc.find("//bpel:invoke").each do |e|
      op = e.attributes['operation']
      plnk_name = e.attributes['partnerLink']
      @doc.find("/bpel:process/bpel:partnerLinks/bpel:partnerLink[@name=\"#{plnk_name}\"]").each do |f|
        plnk_role = f.attributes['partnerRole'] 
        plnk_type = remove_ns f.attributes['partnerLinkType']
        @doc.find("/bpel:process/bpel:import[@importType=\"http://www.w3.org/ns/wsdl\"]").each do |g|
          XML::Smart.open(@base + "/" + g.attributes['location']) do |w|
            w.namespaces = {
              'wsdl' => 'http://www.w3.org/ns/wsdl',
              'plnk' => 'http://schemas.xmlsoap.org/ws/2003/05/partner-link/',
              'std'  => g.attributes['namespace'],
              'xsd'  => 'http://www.w3.org/2001/XMLSchema',
              'whttp' => 'http://www.w3.org/ns/wsdl/http'
            }
            w.find("/wsdl:description/plnk:partnerLinkType[@name='#{plnk_type}']/plnk:role[@name='#{plnk_role}']").each do |h|
              interface = remove_ns h.attributes['portType']
              method = w.find("string(/wsdl:description/wsdl:binding[@interface='#{interface}']/wsdl:operation[@ref='#{op}']/@whttp:method)")
              method = method == '' ? 'SOAP' : method
              n1 = result.root.add("#{plnk_name}.#{op}")
              w.find("/wsdl:description/wsdl:interface[@name='#{interface}']/wsdl:operation[@name='#{op}']/wsdl:*").each do |i|
                schema_nsn = extract_ns i.attributes['element'] 
                schema_root = remove_ns i.attributes['element']
                schema_ns = w.root.namespaces[schema_nsn]
                w.find("/wsdl:description/wsdl:types/xsd:schema[@targetNamespace='#{schema_ns}']").each do |s|
                  n2 = n1.add(i.name.to_s, 'method' => method, 'targetNamespace' => w.root.attributes['targetNamespace'])
                  n2.add(s)
                  n2.find("xsd:schema/xsd:element[@name!='#{schema_root}']").delete_all!
                end
              end
            end
          end  
        end
      end
    end
    result.to_s
  end # }}}
  def transform_invocation # {{{
    result = XML::Smart.string('<invocations/>')
    @doc.find("/bpel:process/bpel:sequence/bpel:receive[@createInstance='yes']").each do |e|
      op = e.attributes['operation']
      plnk_name = e.attributes['partnerLink']
      @doc.find("/bpel:process/bpel:partnerLinks/bpel:partnerLink[@name=\"#{plnk_name}\"]").each do |f|
        plnk_role = f.attributes['myRole'] 
        plnk_type = remove_ns f.attributes['partnerLinkType']
        @doc.find("/bpel:process/bpel:import[@importType=\"http://www.w3.org/ns/wsdl\"]").each do |g|
          XML::Smart.open(@base + "/" + g.attributes['location']) do |w|
            w.namespaces = {
              'wsdl' => 'http://www.w3.org/ns/wsdl',
              'plnk' => 'http://schemas.xmlsoap.org/ws/2003/05/partner-link/',
              'std'  => g.attributes['namespace'],
              'xsd'  => 'http://www.w3.org/2001/XMLSchema',
              'whttp' => 'http://www.w3.org/ns/wsdl/http'
            }
            w.find("/wsdl:description/plnk:partnerLinkType[@name='#{plnk_type}']/plnk:role[@name='#{plnk_role}']").each do |h|
              interface = remove_ns h.attributes['portType']
              method = w.find("string(/wsdl:description/wsdl:binding[@interface='#{interface}']/wsdl:operation[@ref='#{op}']/@whttp:method)")
              method = method == '' ? 'SOAP' : method
              w.find("/wsdl:description/wsdl:interface[@name='#{interface}']/wsdl:operation[@name='#{op}']/wsdl:input").each do |i|
                schema_nsn = extract_ns i.attributes['element'] 
                schema_root = remove_ns i.attributes['element']
                schema_ns = w.root.namespaces[schema_nsn]
                w.find("/wsdl:description/wsdl:types/xsd:schema[@targetNamespace='#{schema_ns}']/xsd:element[@name!='#{schema_root}']").delete_all!
                w.find("/wsdl:description/wsdl:types/xsd:schema[@targetNamespace='#{schema_ns}']").each do |s|
                  node = result.root.add('invocation', 'plnk_name' => plnk_name, 'plnk_role' => plnk_role, 'plnk_type' => plnk_type, 'interface' => interface, 'method' => method, 'targetNamespace' => w.root.attributes['targetNamespace'])
                  node.add(s)
                end
              end
            end
          end  
        end
      end
    end
    result.to_s
  end # }}}

  def print_elements(e,spaces) # {{{
    result = ''
    e.find("*[not(@createInstance) or @createInstance='no']").each do |e|
      result << print_element(e,spaces)
    end  
    result
  end # }}}
  def print_element(e,spaces) # {{{
    result = ''
    case e.name.name
      when 'invoke'
        result << print_activity_plain(spaces)
        result << print_activity_call(e,spaces)
      when 'receive'
        result << print_activity_plain(spaces)
        result << print_activity_call(e)
        result << print_activity_end(spaces)
      when 'reply'
        result << print_reply(e,spaces)
      when 'forEach'
        result << print_foreach(e,spaces)
      when 'pick'
      when 'sequence'
        result << print_elements(e,spaces)
      when 'pick'
      when 'scope'
      when 'wait'
      when 'assign'
        result << print_activity_plain(spaces)
        result << print_activity_manipulate(e)
        result << print_activity_assign(e,spaces+@MULTI)
        result << print_activity_end(spaces)
      when 'if'
        result << print_choose(e,spaces)
      when 'while'
        result << print_while(e,spaces)
      when 'flow'
        result << print_parallel(e,spaces) 
    end
    result
  end # }}}

  def print_activity_plain(spaces) # {{{
    @acounter += 1
    result = print_spaces(spaces)
    result << 'activity :a'
    result << @acounter.to_s
  end    # }}}
  def print_activity_manipulate(e) # {{{
    result = ", :manipulate do\n"
  end    # }}}
  def print_activity_assign(e,spaces) # {{{
    result = ''
    e.find('bpel:copy').each do |c|
      result << print_spaces(spaces)
      result << bpel_copy_x(c,'bpel:to','set')
      result << ' = '
      result << bpel_copy_x(c,'bpel:from','evaluate')
      result << "\n"
    end
    result
  end # }}}
  def print_activity_end(spaces) # {{{
    result = print_spaces(spaces)
    result << "end\n"
  end # }}}
  def bpel_copy_x(c,what,op) # {{{
    result = ''
    c.find(what).each do |to|
      text = if to.attributes['variable']
        if to.attributes['part']
          temp = "$#{to.attributes['variable']}"
          temp << '/' + @vars[to.attributes['variable']].to_s + to.attributes['part']
          result << transform_bpel_xpath(temp,op)
        else
          result << "data.#{to.attributes['variable']}"
        end
        temp
      else
        result << transform_bpel_xpath(to.text,op)
      end
    end
    result
  end # }}}

  def print_choose(e,spaces) # {{{
    result = ''
    result << print_spaces(spaces) << "choose do\n"
    result << print_alternative(e,'alternative',spaces+@MULTI)
    e.find('bpel:elseif').each do |ei|
      result << print_alternative(ei,'alternative',spaces+@MULTI)
    end
    e.find('bpel:else').each do |ei|
      result << print_alternative(ei,'otherwise',spaces+@MULTI)
    end
    result << print_spaces(spaces) << "end\n"
    result
  end # }}}
  def print_alternative(e,word,spaces) # {{{
    result = ''
    result << print_spaces(spaces) 
    case word 
      when 'alternative'
        result << word + " " 
        result << transform_bpel_xpath(e.find('string(bpel:condition)'),'evaluate')
      when 'otherwise'
        result << word
    end    
    result << " do\n"
    result << print_elements(e,spaces+@MULTI)
    result << print_spaces(spaces) << "end\n"
    result
  end # }}}

  def print_while(e,spaces) # {{{
    result = ''
    result << print_spaces(spaces) 
    result << "loop pre_test{" 
    result << transform_bpel_xpath(e.find('string(bpel:condition)'),'evaluate')
    result << "} do\n"
    result << print_elements(e,spaces+@MULTI)
    result << print_spaces(spaces) << "end\n"
    result
  end # }}}
  
  def print_foreach(e,spaces) # {{{
    result = ''
    cname = e.find('string(@counterName)')
    parallel = e.find('boolean(@parallel[.="yes"])')
    sps = spaces

    if parallel
      result << print_spaces(sps) << "parallel(:wait) do\n"
      sps += @MULTI
    end  

    result << print_spaces(sps) << "#{cname} = " << e.find('string(bpel:startCounterValue)') << "\n"
    result << print_spaces(sps) << "loop pre_test{" 
    result << "#{cname} <= " << transform_bpel_xpath(e.find('string(bpel:finalCounterValue)'),'evaluate')
    result << "} do\n"
    if parallel
      sps += @MULTI
      result << print_spaces(sps) << "parallel_branch(#{cname}) do |#{cname}|\n"
    end  
    e.find("*[name()='bpel:scope']").each do |f|
      result << print_elements(f,sps+@MULTI)
    end  
    if parallel
      result << print_spaces(sps) << "end\n"
      sps -= @MULTI
    end  
    result << print_spaces(sps+@MULTI) << "#{cname} += 1\n"
    result << print_spaces(sps) << "end\n"

    if parallel
      result << print_spaces(spaces) << "end\n"
    end  
    result
  end # }}}
  
  def print_reply(e,spaces) # {{{
    result = ''
    result << print_spaces(spaces) 
    result << "status.update(1,\"#{e.attributes['partnerLink']}.#{e.attributes['operation']};#{e.attributes['variable']}\")"
    result
  end # }}}

  def print_parallel(e,spaces) # {{{
    result = ''
    result << print_spaces(spaces) 
    result << "parallel do\n" 

    result << print_spaces(spaces+@MULTI) 
    result << "links = {}\n"

    e.find("*[name()!='bpel:links']").each do |e|
      result << print_spaces(spaces+@MULTI) 
      result << "parallel_branch do\n"

      e.find('bpel:targets/bpel:target').each do |l|
        result << print_spaces(spaces+@MULTI+@MULTI)
        result << "links[\"" + l.attributes['linkName'] + "\"] = Thread.current\n"
        result << print_spaces(spaces+@MULTI+@MULTI)
        result << "Thread.current.stop\n"
      end

      result << print_element(e,spaces+@MULTI+@MULTI)

      e.find('bpel:sources/bpel:source').each do |s|
        result << print_spaces(spaces+@MULTI+@MULTI)
        result << "until links.include?(\"" + s.attributes["linkName"] + "\") && links[\"" + s.attributes["linkName"] + "\"].stop?\n"
        result << print_spaces(spaces+@MULTI+@MULTI+@MULTI)
        result << "Thread.current.pass\n"
        result << print_spaces(spaces+@MULTI+@MULTI) << "end\n"
        result << print_spaces(spaces+@MULTI+@MULTI)
        result << "links[\"" + s.attributes["linkName"] + "\"].run\n"
      end

      result << print_spaces(spaces+@MULTI) << "end\n"
    end

    result << print_spaces(spaces) << "end\n"
    result
  end  # }}}

  def print_activity_call(e,spaces) # {{{
    result = ", :call, :\"#{e.attributes['partnerLink']}.#{e.attributes['operation']}\", data.#{e.attributes['inputVariable']}"
    if e.attributes['outputVariable']
      result << " do |result|\n"
      result << print_spaces(spaces+@MULTI)
      result << "data.#{e.attributes['outputVariable']} = result\n"
      result << print_activity_end(spaces)
    else  
      result << "\n"
    end  
  end    # }}}

  def print_spaces(spaces) # {{{
    ' ' * spaces
  end  # }}}
  def transform_bpel_xpath(text,op) # {{{
    text.gsub!(/\$([a-z][a-zA-Z0-9]+)\.Document/,'/helper/\1')
    text.gsub!(/\$([a-z][a-zA-Z0-9]+)\.([a-z][a-zA-Z0-9]+)/) do
      t1,t2 = $1,$2
      "/helper/#{t1}/" + @vars[t1] + t2
    end 
    text.gsub!(/\$([a-z][a-zA-Z0-9]+)/,'/helper/\1')
    "XPATHHelper.#{op}(\"" + text.strip + "\")"
  end  # }}}

private
  def remove_ns(str) # {{{
    str.gsub(/[a-zA_Z][a-zA_Z0-9]*:/,'')
  end # }}}
  def extract_ns(str) # {{{
    str.nil? ? '' : str.match(/^([a-zA_Z][a-zA_Z0-9]*):/)[1].to_s
  end # }}}
  def extract_ns_plus(str) # {{{
    str.nil? ? '' : str.match(/^[a-zA_Z][a-zA_Z0-9]*:/).to_s
  end # }}}
end
