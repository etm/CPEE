class PropertiesHandler < Riddl::Utils::Properties::HandlerBase
  def sync
    if @property == 'description'
      @data.properties.modify do |doc|
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
      state = @data.properties.data.find("string(/p:properties/p:state)")
      if @data.call_vote("properties/state/change", :instance => @data.id, :newstate => state)
        case state
          when 'stopping'; @data.stop
          when 'running'; @data.start
        end
      else
        if node = @data.properties.data.find("/p:properties/p:state").first
          case state
            when 'stopping'; node.text = 'running'
            when 'running'; node.text = 'stopped'
          end
        end
      end
    else
      @data.unserialize_data!
    end
    case @property
      when 'handlerwrapper'
        @data.notify('properties/description/handlerwrapper')
      when 'description'
        @data.notify('properties/description/change')
      when 'endpoints'
        @data.notify('properties/endpoints/change')
      when 'dataelements'
        @data.notify('properties/dataelements/change')
      else
        nil
    end
  end

  def create; sync; end
  def update; sync; end
  def delete; sync; end
end
