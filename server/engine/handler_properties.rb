class PropertiesHandler < Riddl::Utils::Properties::HandlerBase
  def sync
    if @property == 'description'
      @backend.modify do |doc|
        dsl   = doc.find("/p:properties/p:dsl").first
        trans = doc.find("/p:properties/p:transformation").first
        desc  = doc.find("/p:properties/p:description").first
        if trans.nil?
          dsl.text = desc.to_s
        else
          trans = XML::Smart::string(trans.children.empty? ? trans.to_s : trans.children.first.dump)
          desc  = XML::Smart::string(desc.children.empty? ? desc.to_s : desc.children.first.dump)
          dsl.text = desc.transform_with(trans)
        end
      end
    end  
    if @property == 'state'
      state = @backend.properties.find("string(/p:properties/p:state)")
      if $controller[@backend.id].call_vote("properties/state/change", :instance => @backend.id, :newstate => state)
        case state
          when 'stopping'; $controller[@backend.id].stop
          when 'running'; $controller[@backend.id].start
        end
      else
        if node = @backend.properties.find("/p:properties/p:state").first
          case state
            when 'stopping'; node.text = 'running'
            when 'running'; node.text = 'stopped'
          end
        end
      end
    else
      $controller[@backend.id].unserialize_data!
    end
    case @property
      when 'handlerwrapper'
        $controller[@backend.id].notify('properties/description/handlerwrapper')
      when 'description'
        $controller[@backend.id].notify('properties/description/change')
      when 'endpoints'
        $controller[@backend.id].notify('properties/endpoints/change')
      when 'dataelements'
        $controller[@backend.id].notify('properties/dataelements/change')
      else
        nil
    end
  end

  def create; sync; end
  def update; sync; end
  def delete; sync; end
end
