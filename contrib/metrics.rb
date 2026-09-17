#!/usr/bin/ruby
require 'xml/smart'
require 'pastel'

pastel = Pastel.new

metrics ={  #{{{
  :models => 0,
  :tasks => 0,
  :tasks_simple => 0,
  :tasks_data_handling => 0,
  :tasks_script => 0,
  :gateways => 0,
  :gateways_parallel => 0,
  :gateways_parallel_branches => 0,
  :gateways_choice => 0,
  :gateways_choice_in => 0,
  :gateways_choice_ex => 0,
  :gateways_loop => 0,
  :gateways_loop_pre => 0,
  :gateways_loop_post => 0,
  :data => 0,
  :data_ops => 0,
  :data_read => 0,
  :data_write => 0,
  :data_ops_task => 0,
  :data_read_task => 0,
  :data_write_task => 0,
  :data_ops_gw => 0,
  :data_read_gw => 0,
  :data_write_gw => 0
} #}}}
labels = {  #{{{
  :models =>                     [ 'Models:           ', Proc.new{ |s| pastel.red.bold.underline(s.to_s) } ],
  :tasks =>                      [ 'Tasks:            ', Proc.new{ |s| pastel.red.bold.underline(s.to_s) } ],
  :tasks_simple =>               [ '  No Output Data: ', Proc.new{ |s| s.to_s } ],
  :tasks_data_handling =>        [ '  Output Data:    ', Proc.new{ |s| s.to_s } ],
  :tasks_script =>               [ '  Script:         ', Proc.new{ |s| s.to_s } ],
  :gateways =>                   [ 'Gateways:         ', Proc.new{ |s| pastel.red.bold.underline(s.to_s) } ],
  :gateways_parallel =>          [ ' Parallel:        ', Proc.new{ |s| s.to_s } ],
  :gateways_parallel_branches => [ '    Branches:     ', Proc.new{ |s| s.to_s } ],
  :gateways_choice =>            [ '  Choice:         ', Proc.new{ |s| s.to_s } ],
  :gateways_choice_in =>         [ '    Inclusive:    ', Proc.new{ |s| s.to_s } ],
  :gateways_choice_ex =>         [ '    Exclusive:    ', Proc.new{ |s| s.to_s } ],
  :gateways_loop =>              [ '  Loop:           ', Proc.new{ |s| s.to_s } ],
  :gateways_loop_pre =>          [ '    Pre Test:     ', Proc.new{ |s| s.to_s } ],
  :gateways_loop_post =>         [ '    Post Test:    ', Proc.new{ |s| s.to_s } ],
  :data =>                       [ 'Data Elements:    ', Proc.new{ |s| pastel.red.bold.underline(s.to_s) } ],
  :data_ops =>                   [ 'Data Ops:         ', Proc.new{ |s| pastel.red.bold.underline(s.to_s) } ],
  :data_read =>                  [ '  Read:           ', Proc.new{ |s| s.to_s } ],
  :data_write =>                 [ '  Write:          ', Proc.new{ |s| s.to_s } ],
  :data_ops_task =>              [ '  Ops Task:       ', Proc.new{ |s| s.to_s } ],
  :data_read_task =>             [ '    Read:         ', Proc.new{ |s| s.to_s } ],
  :data_write_task =>            [ '    Write:        ', Proc.new{ |s| s.to_s } ],
  :data_ops_gw =>                [ '  Ops Gw (Read):  ', Proc.new{ |s| s.to_s } ]
} #}}}

def dataflowExtract(subject,mixed,&extract) #{{{
  dict = {}
  regassi =      /data\.([a-zA-Z_]+)\s*(=[^=]|\+\=|\-\=|\*\=|\/\=|<<|>>|\|\|=)/
  reg_not_assi = /data\.([a-zA-Z_]+)\s*/

  subject.each do |ele|
    item = extract.call(ele)
    return unless item
    return if mixed && item.length > 0 && item[0] != '!'

    indices = []

    matches = []; item.scan(regassi){ matches << Regexp.last_match }
    matches.each do |md|
      indices << md.offset(0)[0]
      dict[md[1]] = "Assign"
    end
    matches = []; item.scan(reg_not_assi){ matches << Regexp.last_match }
    matches.each do |md|
      arg1 = md[1]
      midx = md.offset(0)[0]
      next if indices.include?(midx)
      if dict[arg1] == "Assign" || dict[arg1] == "AssignRead"
        if midx < indices[0]
          dict[arg1] = "ReadAssign"
        else
          dict[arg1] = "AssignRead";
        end
      else
        dict[arg1] = "Read"
      end
    end
  end
  dict
end #}}}
def dataflowMerge(dict,merge) #{{{
  merge.keys.each do |key|
    if dict[key] == 'Read' && (merge[key] == 'Assign' || merge[key] == 'AssignRead')
      dict[key] = 'ReadAssign';
    elsif dict[key] == 'Assign' && merge[key] == 'Assign'
      dict[key] = 'Assign';
    elsif dict[key] == 'Assign' && merge[key] != 'Assign'
      dict[key] = 'AssignRead';
    elsif dict[key] == 'AssignRead' || dict[key] == 'ReadAssign'
    else
      dict[key] = merge[key]
    end
  end
  dict
end #}}}
def dataflowCount(dict,des,reds,asss,ops) #{{{
  dict.each do |k,v|
    des << k
    case v
      when 'ReadAssign', 'AssignRead'
        reds += 1
        asss += 1
        ops += 2
      when 'Read'
        reds += 1
        ops += 1
      when 'Assign'
        asss += 1
        ops += 1
    end
  end
  [reds,asss,ops]
end   #}}}

def formatRatio(z1,z2)
  if z1 > z2
    return "#{(z1/z2.to_f).round(2)}/1"
  else
    return "1/#{(z2/z1.to_f).round(2)}"
  end
end

Dir.glob('**/*.xml').each do |f|
  metrics[:models] += 1
  XML::Smart.open_unprotected(f) do |doc|
    doc.register_namespace 'p', 'http://cpee.org/ns/properties/2.0'
    doc.register_namespace 'd', 'http://cpee.org/ns/description/1.0'

    doc.find('/p:*/p:description/d:description').each do |model|
      m1 = model.find('.//d:call[d:code]').length
      m2 = model.find('.//d:call[not(d:code)]').length
      m3 = model.find('.//d:manipulate').length

      metrics[:tasks_data_handling] += m1
      metrics[:tasks_simple] += m2
      metrics[:tasks_script] += m3
      metrics[:tasks] += m1 + m2 + m3

      m1 = model.find('.//d:loop[@mode="pre_test"]').length
      m2 = model.find('.//d:loop[@mode="post_test"]').length
      m3 = m1 + m2
      m4 = model.find('.//d:parallel').length
      m5 = model.find('.//d:parallel_branch').length
      m6 = model.find('.//d:choose[@mode="exclusive"]').length
      m7 = model.find('.//d:choose[@mode="inclusive"]').length
      m8 = m6 + m7
      m9 = m3 + m4 + m8

      metrics[:gateways_loop_pre]          += m1
      metrics[:gateways_loop_post]         += m2
      metrics[:gateways_loop]              += m3
      metrics[:gateways_parallel]          += m4
      metrics[:gateways_parallel_branches] += m5
      metrics[:gateways_choice_ex]         += m6
      metrics[:gateways_choice_in]         += m7
      metrics[:gateways_choice]            += m8
      metrics[:gateways]                   += m9

      des = []
      reds1 = 0
      asss1 = 0
      ops1 = 0
      model.find('.//d:call').each do |node|
        dict0 = dataflowExtract(node.find('d:code/d:prepare'),false) { |ele| ele.text }
        dict1 = dataflowExtract(node.find('.//d:parameters/d:arguments/d:*'),false) { |ele| ele.text }
        dict2 = dataflowExtract(node.find('d:code/d:finalize | .//d:call/d:code/d:update | .//d:call/d:code/d:rescue'),false) { |ele| ele.text }
        dataflowMerge(dict0,dict1)
        dataflowMerge(dict0,dict2)
        reds1, asss1, ops1 = dataflowCount(dict0,des,reds1,asss1,ops1)
      end
      model.find('.//d:manipulate').each do |node|
        dict = dataflowExtract(node.find('.'),false) { |ele| ele.text }
        reds1, asss1, ops1 = dataflowCount(dict,des,reds1,asss1,ops1)
      end
      reds2 = 0
      asss2 = 0
      ops2 = 0
      model.find('.//d:alternative').each do |node|
        dict = dataflowExtract(node.find('@condition'),false) { |ele| ele.text }
        reds2, asss2, ops2 = dataflowCount(dict,des,reds2,asss2,ops2)
      end
      model.find('.//d:loop').each do |node|
        dict = dataflowExtract(node.find('@condition'),false) { |ele| ele.text }
        reds2, asss2, ops2 = dataflowCount(dict,des,reds2,asss2,ops2)
      end
      des.uniq!

      metrics[:data]            += des.length
      metrics[:data_ops]        += ops1 + ops2
      metrics[:data_read]       += reds1 + reds2
      metrics[:data_write]      += asss1 + asss2
      metrics[:data_ops_task]   += ops1
      metrics[:data_read_task]  += reds1
      metrics[:data_write_task] += asss1
      metrics[:data_ops_gw]     += ops2
      metrics[:data_read_gw]    += reds2
      metrics[:data_write_gw]   += asss2
    end
  end
end

labels.each do |k,_|
  puts "#{labels[k][0]}: #{labels[k][1].call(metrics[k])}"
end
puts '-' * 50
puts "Tasks / Data Elements:        #{formatRatio(metrics[:tasks],metrics[:data])}"
puts "Tasks / Data Connetions:      #{formatRatio(metrics[:tasks],metrics[:data_ops_task])}"
puts "Control Flow / Data Elements: #{formatRatio(metrics[:tasks] + metrics[:gateways],metrics[:data])}"
